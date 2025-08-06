import 'dart:io';
import 'package:flutter/cupertino.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:macos_ui/macos_ui.dart';

import '../../../../core/services/file_picker_service.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/project_validation_service.dart';
import '../../domain/entities/project.dart';
import '../../domain/usecases/create_project.dart';
import '../bloc/project_bloc.dart';
import '../bloc/project_event.dart';
import '../bloc/project_state.dart';

class ProjectsPage extends StatefulWidget {
  const ProjectsPage({super.key});

  @override
  State<ProjectsPage> createState() => _ProjectsPageState();
}

class _ProjectsPageState extends State<ProjectsPage> {
  @override
  void initState() {
    super.initState();
    // Load projects when the page initializes
    context.read<ProjectBloc>().add(const LoadProjects());
  }

  void _showCreateProjectDialog() {
    print('🔧 DEBUG: _showCreateProjectDialog called');
    try {
      showCupertinoDialog(
        context: context,
        builder: (context) {
          print('🔧 DEBUG: Dialog builder called');
          return const CreateProjectDialog();
        },
      );
      print('🔧 DEBUG: showCupertinoDialog completed');
    } catch (e) {
      print('🔧 DEBUG: Error showing dialog: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return MacosScaffold(
      toolBar: ToolBar(
        title: Text(
          'Projects',
          style: TextStyle(color: AppTheme.greyMaroonDark),
        ),
        centerTitle: true,
        actions: [
          ToolBarIconButton(
            icon: const MacosIcon(CupertinoIcons.plus),
            onPressed: _showCreateProjectDialog,
            label: 'New Project',
            showLabel: true,
          ),
        ],
      ),
      children: [
        ContentArea(
          builder: (context, scrollController) {
            return Stack(
              children: [
                Container(
                  color: AppTheme.paleStraw,
                  child: BlocConsumer<ProjectBloc, ProjectState>(
              listener: (context, state) {
                if (state is ProjectError) {
                  _showErrorSnackBar(context, state.message);
                } else if (state is ProjectCreated) {
                  _showSuccessSnackBar(context, 'Project created successfully');
                } else if (state is ProjectUpdated) {
                  _showSuccessSnackBar(context, 'Project updated successfully');
                } else if (state is ProjectDeleted) {
                  _showSuccessSnackBar(context, 'Project deleted successfully');
                }
              },
              builder: (context, state) {
                if (state is ProjectLoading) {
                  return const Center(child: ProgressCircle());
                } else if (state is ProjectsLoaded) {
                  if (state.projects.isEmpty) {
                    return _buildEmptyState();
                  }
                  return _buildProjectsList(state.projects);
                } else if (state is ProjectError) {
                  return _buildErrorState(state.message);
                } else {
                  return _buildEmptyState();
                }
              },
                  ),
                ),
                // Floating action button for easy access
                Positioned(
                  bottom: 20,
                  right: 20,
                  child: PushButton(
                    controlSize: ControlSize.large,
                    onPressed: _showCreateProjectDialog,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        MacosIcon(CupertinoIcons.plus, size: 16),
                        const SizedBox(width: 8),
                        const Text('New Project'),
                      ],
                    ),
                  ),
                ),
              ],
            );
          },
        ),
      ],
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          MacosIcon(
            CupertinoIcons.folder,
            size: 64,
            color: AppTheme.lightText,
          ),
          const SizedBox(height: 16),
          Text(
            'No Projects Yet',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: AppTheme.greyMaroon,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Create your first project to get started',
            style: TextStyle(
              color: AppTheme.lightText,
            ),
          ),
          const SizedBox(height: 24),
          PushButton(
            controlSize: ControlSize.large,
            onPressed: _showCreateProjectDialog,
            child: const Text('Create Project'),
          ),
        ],
      ),
    );
  }

  Widget _buildProjectsList(List<Project> projects) {
    return Padding(
      padding: const EdgeInsets.all(20.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '${projects.length} Projects',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w500,
              color: AppTheme.greyMaroonLight,
            ),
          ),
          const SizedBox(height: 16),
          Expanded(
            child: ListView.builder(
              itemCount: projects.length,
              itemBuilder: (context, index) {
                final project = projects[index];
                return _buildProjectCard(project);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProjectCard(Project project) {
    Color statusColor;
    switch (project.status) {
      case ProjectStatus.draft:
        statusColor = AppTheme.planningColor; // Reuse planning color for draft
        break;
      case ProjectStatus.active:
        statusColor = AppTheme.activeColor;
        break;
      case ProjectStatus.completed:
        statusColor = AppTheme.completedColor;
        break;
      case ProjectStatus.archived:
        statusColor = AppTheme.onHoldColor; // Reuse onHold color for archived
        break;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: MacosTheme.of(context).canvasColor,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: MacosTheme.of(context).dividerColor,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  project.title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 8,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: statusColor.withValues(alpha: 0.3),
                  ),
                ),
                child: Text(
                  project.status.name.toUpperCase(),
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: statusColor,
                  ),
                ),
              ),
            ],
          ),
          if (project.description.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              project.description,
              style: TextStyle(
                color: AppTheme.lightText,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Created ${_formatDate(project.createdAt)}',
                style: TextStyle(
                  fontSize: 12,
                  color: AppTheme.lightText,
                ),
              ),
              Row(
                children: [
                  MacosIconButton(
                    icon: const MacosIcon(CupertinoIcons.pencil),
                    onPressed: () => _editProject(project),
                  ),
                  MacosIconButton(
                    icon: const MacosIcon(CupertinoIcons.trash),
                    onPressed: () => _deleteProject(project),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);
    
    if (difference.inDays > 0) {
      return '${difference.inDays} days ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours} hours ago';
    } else {
      return 'Just now';
    }
  }

  void _editProject(Project project) {
    showCupertinoDialog(
      context: context,
      builder: (context) => EditProjectDialog(project: project),
    );
  }

  void _deleteProject(Project project) {
    showCupertinoDialog(
      context: context,
      builder: (context) => MacosAlertDialog(
        appIcon: const MacosIcon(CupertinoIcons.exclamationmark_triangle),
        title: const Text('Delete Project'),
        message: Text('Are you sure you want to delete "${project.title}"? This action cannot be undone.'),
        primaryButton: PushButton(
          controlSize: ControlSize.large,
          onPressed: () {
            Navigator.of(context).pop();
            context.read<ProjectBloc>().add(DeleteProject(project.id));
          },
          child: const Text('Delete'),
        ),
        secondaryButton: PushButton(
          controlSize: ControlSize.large,
          secondary: true,
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
      ),
    );
  }

  Widget _buildErrorState(String message) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          MacosIcon(
            CupertinoIcons.exclamationmark_triangle,
            size: 64,
            color: AppTheme.errorColor,
          ),
          const SizedBox(height: 16),
          Text(
            'Error Loading Projects',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: AppTheme.errorColor,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            message,
            style: TextStyle(
              color: AppTheme.lightText,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          PushButton(
            controlSize: ControlSize.large,
            onPressed: () => context.read<ProjectBloc>().add(const LoadProjects()),
            child: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  void _showErrorSnackBar(BuildContext context, String message) {
    // macOS doesn't have snackbars, so we'll show a dialog instead
    showCupertinoDialog(
      context: context,
      builder: (context) => MacosAlertDialog(
        appIcon: const MacosIcon(CupertinoIcons.exclamationmark_triangle),
        title: const Text('Error'),
        message: Text(message),
        primaryButton: PushButton(
          controlSize: ControlSize.large,
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('OK'),
        ),
      ),
    );
  }

  void _showSuccessSnackBar(BuildContext context, String message) {
    // macOS doesn't have snackbars, show a brief dialog
    showCupertinoDialog(
      context: context,
      builder: (context) => MacosAlertDialog(
        appIcon: const MacosIcon(CupertinoIcons.checkmark_circle),
        title: const Text('Success'),
        message: Text(message),
        primaryButton: PushButton(
          controlSize: ControlSize.large,
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('OK'),
        ),
      ),
    );
  }
}

class CreateProjectDialog extends StatefulWidget {
  const CreateProjectDialog({super.key});

  @override
  State<CreateProjectDialog> createState() => _CreateProjectDialogState();
}

class _CreateProjectDialogState extends State<CreateProjectDialog> {
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _localSourceFolderController = TextEditingController();
  final _githubRepoController = TextEditingController();
  ProjectStatus _selectedStatus = ProjectStatus.draft;
  final List<File> _attachedFiles = [];
  String? _localSourceFolderError;
  String? _githubRepoError;

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    _localSourceFolderController.dispose();
    _githubRepoController.dispose();
    super.dispose();
  }

  Future<void> _pickFiles() async {
    try {
      final files = await FilePickerService.pickMultipleFiles(maxFileCount: 3);
      setState(() {
        _attachedFiles.addAll(files);
      });
    } catch (e) {
      if (mounted) {
        _showErrorDialog('Failed to pick files: $e');
      }
    }
  }

  void _removeFile(int index) {
    setState(() {
      _attachedFiles.removeAt(index);
    });
  }

  void _validateLocalSourceFolder() {
    final result = ProjectValidationService.instance.validateLocalSourceFolder(_localSourceFolderController.text);
    setState(() {
      _localSourceFolderError = result.isValid ? null : result.errorMessage;
    });
  }

  void _validateGithubRepo() {
    final result = ProjectValidationService.instance.validateGithubRepo(_githubRepoController.text);
    setState(() {
      _githubRepoError = result.isValid ? null : result.errorMessage;
    });
  }

  bool get _isValid {
    return _nameController.text.trim().isNotEmpty &&
           _localSourceFolderError == null &&
           _githubRepoError == null;
  }

  void _showErrorDialog(String message) {
    showCupertinoDialog(
      context: context,
      builder: (context) => MacosAlertDialog(
        appIcon: const MacosIcon(CupertinoIcons.exclamationmark_triangle),
        title: const Text('Error'),
        message: Text(message),
        primaryButton: PushButton(
          controlSize: ControlSize.large,
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('OK'),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return MacosAlertDialog(
      appIcon: const MacosIcon(CupertinoIcons.folder_badge_plus),
      title: const Text('Create New Project'),
      message: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          MacosTextField(
            controller: _nameController,
            placeholder: 'Project Name',
          ),
          const SizedBox(height: 12),
          MacosTextField(
            controller: _descriptionController,
            placeholder: 'Description (optional)',
            maxLines: 3,
          ),
          const SizedBox(height: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              MacosTextField(
                controller: _localSourceFolderController,
                placeholder: 'Local Source Folder (optional)',
                onChanged: (_) => _validateLocalSourceFolder(),
              ),
              if (_localSourceFolderError != null) ...[
                const SizedBox(height: 4),
                Text(
                  _localSourceFolderError!,
                  style: TextStyle(
                    fontSize: 12,
                    color: AppTheme.errorColor,
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              MacosTextField(
                controller: _githubRepoController,
                placeholder: 'GitHub Repository URL (optional)',
                onChanged: (_) => _validateGithubRepo(),
              ),
              if (_githubRepoError != null) ...[
                const SizedBox(height: 4),
                Text(
                  _githubRepoError!,
                  style: TextStyle(
                    fontSize: 12,
                    color: AppTheme.errorColor,
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              const Text('Status: '),
              Expanded(
                child: MacosPopupButton<ProjectStatus>(
                  value: _selectedStatus,
                  onChanged: (value) {
                    if (value != null) {
                      setState(() {
                        _selectedStatus = value;
                      });
                    }
                  },
                  items: ProjectStatus.values.map((status) {
                    return MacosPopupMenuItem(
                      value: status,
                      child: Text(status.name.toUpperCase()),
                    );
                  }).toList(),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Attachments:',
                style: TextStyle(fontWeight: FontWeight.w500),
              ),
              PushButton(
                controlSize: ControlSize.mini,
                onPressed: _attachedFiles.length < 3 ? _pickFiles : null,
                child: const Text('Add Files'),
              ),
            ],
          ),
          if (_attachedFiles.isNotEmpty) ...[
            const SizedBox(height: 8),
            SizedBox(
              height: 120,
              child: ListView.builder(
                itemCount: _attachedFiles.length,
                itemBuilder: (context, index) {
                  final fileInfo = FilePickerService.getFileInfo(_attachedFiles[index]);
                  return Container(
                    margin: const EdgeInsets.only(bottom: 4),
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: MacosTheme.of(context).canvasColor,
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(
                        color: MacosTheme.of(context).dividerColor,
                      ),
                    ),
                    child: Row(
                      children: [
                        MacosIcon(
                          fileInfo.isImage 
                            ? CupertinoIcons.photo 
                            : fileInfo.isDocument 
                              ? CupertinoIcons.doc 
                              : CupertinoIcons.doc_plaintext,
                          size: 16,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                fileInfo.name,
                                style: const TextStyle(fontSize: 12),
                                overflow: TextOverflow.ellipsis,
                              ),
                              Text(
                                fileInfo.sizeFormatted,
                                style: TextStyle(
                                  fontSize: 10,
                                  color: AppTheme.lightText,
                                ),
                              ),
                            ],
                          ),
                        ),
                        MacosIconButton(
                          icon: const MacosIcon(CupertinoIcons.xmark_circle_fill),
                          onPressed: () => _removeFile(index),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ],
        ],
      ),
      primaryButton: PushButton(
        controlSize: ControlSize.large,
        onPressed: !_isValid
            ? null
            : () {
                final localFolder = _localSourceFolderController.text.trim();
                final githubUrl = _githubRepoController.text.trim();
                
                final params = CreateProjectParams(
                  title: _nameController.text.trim(),
                  description: _descriptionController.text.trim(),
                  status: _selectedStatus,
                  localSourceFolder: localFolder.isEmpty ? null : localFolder,
                  githubRepo: githubUrl.isEmpty ? null : githubUrl,
                );
                context.read<ProjectBloc>().add(CreateProjectEvent(params));
                Navigator.of(context).pop();
              },
        child: const Text('Create'),
      ),
      secondaryButton: PushButton(
        controlSize: ControlSize.large,
        secondary: true,
        onPressed: () => Navigator.of(context).pop(),
        child: const Text('Cancel'),
      ),
    );
  }
}

class EditProjectDialog extends StatefulWidget {
  const EditProjectDialog({super.key, required this.project});

  final Project project;

  @override
  State<EditProjectDialog> createState() => _EditProjectDialogState();
}

class _EditProjectDialogState extends State<EditProjectDialog> {
  late final TextEditingController _nameController;
  late final TextEditingController _descriptionController;
  late final TextEditingController _localSourceFolderController;
  late final TextEditingController _githubRepoController;
  late ProjectStatus _selectedStatus;
  String? _localSourceFolderError;
  String? _githubRepoError;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.project.title);
    _descriptionController = TextEditingController(text: widget.project.description);
    _localSourceFolderController = TextEditingController(text: widget.project.localSourceFolder ?? '');
    _githubRepoController = TextEditingController(text: widget.project.githubRepo ?? '');
    _selectedStatus = widget.project.status;
  }

  void _validateLocalSourceFolder() {
    final result = ProjectValidationService.instance.validateLocalSourceFolder(_localSourceFolderController.text);
    setState(() {
      _localSourceFolderError = result.isValid ? null : result.errorMessage;
    });
  }

  void _validateGithubRepo() {
    final result = ProjectValidationService.instance.validateGithubRepo(_githubRepoController.text);
    setState(() {
      _githubRepoError = result.isValid ? null : result.errorMessage;
    });
  }

  bool get _isValid {
    return _nameController.text.trim().isNotEmpty &&
           _localSourceFolderError == null &&
           _githubRepoError == null;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    _localSourceFolderController.dispose();
    _githubRepoController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MacosAlertDialog(
      appIcon: const MacosIcon(CupertinoIcons.pencil),
      title: const Text('Edit Project'),
      message: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          MacosTextField(
            controller: _nameController,
            placeholder: 'Project Name',
          ),
          const SizedBox(height: 12),
          MacosTextField(
            controller: _descriptionController,
            placeholder: 'Description (optional)',
            maxLines: 3,
          ),
          const SizedBox(height: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              MacosTextField(
                controller: _localSourceFolderController,
                placeholder: 'Local Source Folder (optional)',
                onChanged: (_) => _validateLocalSourceFolder(),
              ),
              if (_localSourceFolderError != null) ...[
                const SizedBox(height: 4),
                Text(
                  _localSourceFolderError!,
                  style: TextStyle(
                    fontSize: 12,
                    color: AppTheme.errorColor,
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              MacosTextField(
                controller: _githubRepoController,
                placeholder: 'GitHub Repository URL (optional)',
                onChanged: (_) => _validateGithubRepo(),
              ),
              if (_githubRepoError != null) ...[
                const SizedBox(height: 4),
                Text(
                  _githubRepoError!,
                  style: TextStyle(
                    fontSize: 12,
                    color: AppTheme.errorColor,
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              const Text('Status: '),
              Expanded(
                child: MacosPopupButton<ProjectStatus>(
                  value: _selectedStatus,
                  onChanged: (value) {
                    if (value != null) {
                      setState(() {
                        _selectedStatus = value;
                      });
                    }
                  },
                  items: ProjectStatus.values.map((status) {
                    return MacosPopupMenuItem(
                      value: status,
                      child: Text(status.name.toUpperCase()),
                    );
                  }).toList(),
                ),
              ),
            ],
          ),
        ],
      ),
      primaryButton: PushButton(
        controlSize: ControlSize.large,
        onPressed: !_isValid
            ? null
            : () {
                final localFolder = _localSourceFolderController.text.trim();
                final githubUrl = _githubRepoController.text.trim();
                
                final updatedProject = widget.project.copyWith(
                  title: _nameController.text.trim(),
                  description: _descriptionController.text.trim(),
                  status: _selectedStatus,
                  localSourceFolder: localFolder.isEmpty ? null : localFolder,
                  githubRepo: githubUrl.isEmpty ? null : githubUrl,
                );
                context.read<ProjectBloc>().add(UpdateProject(updatedProject));
                Navigator.of(context).pop();
              },
        child: const Text('Save'),
      ),
      secondaryButton: PushButton(
        controlSize: ControlSize.large,
        secondary: true,
        onPressed: () => Navigator.of(context).pop(),
        child: const Text('Cancel'),
      ),
    );
  }
}