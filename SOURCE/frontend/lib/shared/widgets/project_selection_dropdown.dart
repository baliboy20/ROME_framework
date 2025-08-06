import 'package:flutter/cupertino.dart';
import 'package:macos_ui/macos_ui.dart';

import '../../core/theme/app_theme.dart';
import '../../core/services/app_logger.dart';
import '../../features/project/domain/entities/project.dart';
import '../../features/project/domain/repositories/project_selection_repository.dart';

/// A dropdown widget for selecting projects
/// Automatically loads active projects and provides selection functionality
class ProjectSelectionDropdown extends StatefulWidget {
  const ProjectSelectionDropdown({
    super.key,
    required this.repository,
    this.selectedProjectId,
    required this.onProjectSelected,
    this.enabled = true,
    this.placeholder = 'Select Project',
  });

  final ProjectSelectionRepository repository;
  final String? selectedProjectId;
  final ValueChanged<ProjectSelectionItem?> onProjectSelected;
  final bool enabled;
  final String placeholder;

  @override
  State<ProjectSelectionDropdown> createState() => _ProjectSelectionDropdownState();
}

class _ProjectSelectionDropdownState extends State<ProjectSelectionDropdown> {
  List<ProjectSelectionItem> _projects = [];
  bool _isLoading = false;
  String? _errorMessage;
  ProjectSelectionItem? _selectedProject;

  @override
  void initState() {
    super.initState();
    _loadProjects();
  }

  @override
  void didUpdateWidget(ProjectSelectionDropdown oldWidget) {
    super.didUpdateWidget(oldWidget);
    
    // Reload projects if repository changed
    if (oldWidget.repository != widget.repository) {
      _loadProjects();
    }
    
    // Update selected project if selectedProjectId changed
    if (oldWidget.selectedProjectId != widget.selectedProjectId) {
      _updateSelectedProject();
    }
  }

  Future<void> _loadProjects() async {
    if (!mounted) return;
    
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      AppLogger.instance.debug('Loading projects for dropdown selection');
      final result = await widget.repository.getActiveProjects();
      
      if (!mounted) return;
      
      result.fold(
        (failure) {
          AppLogger.instance.error('Failed to load projects for dropdown: ${failure.message}');
          setState(() {
            _isLoading = false;
            _errorMessage = failure.message;
            _projects = [];
          });
        },
        (projects) {
          AppLogger.instance.info('Loaded ${projects.length} projects for dropdown');
          setState(() {
            _isLoading = false;
            _errorMessage = null;
            _projects = projects;
          });
          _updateSelectedProject();
        },
      );
    } catch (e) {
      if (!mounted) return;
      AppLogger.instance.error('Unexpected error loading projects for dropdown: $e');
      setState(() {
        _isLoading = false;
        _errorMessage = 'Failed to load projects';
        _projects = [];
      });
    }
  }

  void _updateSelectedProject() {
    if (widget.selectedProjectId == null) {
      _selectedProject = null;
      return;
    }

    final project = _projects.where((p) => p.id == widget.selectedProjectId).firstOrNull;
    if (project != _selectedProject) {
      setState(() {
        _selectedProject = project;
      });
    }
  }

  void _onProjectChanged(ProjectSelectionItem? project) {
    setState(() {
      _selectedProject = project;
    });
    widget.onProjectSelected(project);
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Row(
        children: [
          const SizedBox(
            width: 16,
            height: 16,
            child: ProgressCircle(),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'Loading projects...',
              style: TextStyle(
                color: AppTheme.lightText,
                fontSize: 14,
              ),
            ),
          ),
        ],
      );
    }

    if (_errorMessage != null) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: AppTheme.errorColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(6),
              border: Border.all(
                color: AppTheme.errorColor.withValues(alpha: 0.3),
              ),
            ),
            child: Row(
              children: [
                MacosIcon(
                  CupertinoIcons.exclamationmark_triangle,
                  color: AppTheme.errorColor,
                  size: 16,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    _errorMessage!,
                    style: TextStyle(
                      color: AppTheme.errorColor,
                      fontSize: 14,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          PushButton(
            controlSize: ControlSize.mini,
            onPressed: _loadProjects,
            child: const Text('Retry'),
          ),
        ],
      );
    }

    if (_projects.isEmpty) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: AppTheme.lightText.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(6),
          border: Border.all(
            color: AppTheme.lightText.withValues(alpha: 0.2),
          ),
        ),
        child: Row(
          children: [
            MacosIcon(
              CupertinoIcons.info_circle,
              color: AppTheme.lightText,
              size: 16,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                'No active projects available',
                style: TextStyle(
                  color: AppTheme.lightText,
                  fontSize: 14,
                ),
              ),
            ),
          ],
        ),
      );
    }

    return ConstrainedBox(
      constraints: const BoxConstraints(minWidth: 200),
      child: MacosPopupButton<ProjectSelectionItem>(
        value: _selectedProject,
        onChanged: widget.enabled ? _onProjectChanged : null,
        items: [
        // Add a "No selection" option
        MacosPopupMenuItem<ProjectSelectionItem>(
          value: null,
          child: Text(
            widget.placeholder,
            style: TextStyle(
              color: AppTheme.lightText,
              fontStyle: FontStyle.italic,
            ),
          ),
        ),
        // Add all available projects
        ..._projects.map((project) {
          return MacosPopupMenuItem<ProjectSelectionItem>(
            value: project,
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: _getStatusColor(project.status).withValues(alpha: 0.8),
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 8),
                Flexible(
                  child: Text(
                    project.title,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 4),
                Text(
                  project.status.displayName.toUpperCase(),
                  style: TextStyle(
                    fontSize: 8,
                    color: AppTheme.lightText,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          );
        }),
      ],
    ),
    );
  }

  Color _getStatusColor(ProjectStatus status) {
    switch (status) {
      case ProjectStatus.draft:
        return AppTheme.planningColor;
      case ProjectStatus.active:
        return AppTheme.activeColor;
      case ProjectStatus.completed:
        return AppTheme.completedColor;
      case ProjectStatus.archived:
        return AppTheme.onHoldColor;
    }
  }
}

/// Extension to get the first element or null
extension FirstOrNullExtension<T> on Iterable<T> {
  T? get firstOrNull {
    final iterator = this.iterator;
    if (iterator.moveNext()) {
      return iterator.current;
    }
    return null;
  }
}