import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:macos_ui/macos_ui.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../core/di/service_locator.dart';
import '../../../../shared/widgets/project_selection_dropdown.dart';
import '../../../project/domain/entities/project.dart';
import '../../../project/domain/repositories/project_selection_repository.dart';
import '../../domain/entities/task.dart';
import '../../domain/usecases/create_task.dart';
import '../bloc/task_bloc.dart';
import '../bloc/task_event.dart';
import '../bloc/task_state.dart';

class TasksPage extends StatefulWidget {
  const TasksPage({super.key});

  @override
  State<TasksPage> createState() => _TasksPageState();
}

class _TasksPageState extends State<TasksPage> {
  TaskStatus? _filterStatus;

  @override
  void initState() {
    super.initState();
    // Load tasks when the page initializes
    context.read<TaskBloc>().add(const LoadTasks());
  }

  void _showCreateTaskDialog() {
    showCupertinoDialog(
      context: context,
      builder: (context) => const CreateTaskDialog(),
    );
  }

  void _onFilterChanged(TaskStatus? status) {
    setState(() {
      _filterStatus = status;
    });
    
    if (status == null) {
      context.read<TaskBloc>().add(const LoadTasks());
    } else {
      context.read<TaskBloc>().add(LoadTasksByStatus(status));
    }
  }

  @override
  Widget build(BuildContext context) {
    return MacosScaffold(
      toolBar: ToolBar(
        title: Text(
          'Tasks',
          style: TextStyle(color: AppTheme.greyMaroonDark),
        ),
        centerTitle: true,
        actions: [
          ToolBarIconButton(
            icon: const MacosIcon(CupertinoIcons.plus),
            onPressed: _showCreateTaskDialog,
            label: 'New Task',
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
                  child: BlocConsumer<TaskBloc, TaskState>(
              listener: (context, state) {
                if (state is TaskError) {
                  _showErrorSnackBar(context, state.message);
                } else if (state is TaskCreated) {
                  _showSuccessSnackBar(context, 'Task created successfully');
                } else if (state is TaskUpdated) {
                  _showSuccessSnackBar(context, 'Task updated successfully');
                } else if (state is TaskDeleted) {
                  _showSuccessSnackBar(context, 'Task deleted successfully');
                }
              },
              builder: (context, state) {
                return Column(
                  children: [
                    _buildFilterBar(state),
                    Expanded(
                      child: _buildTasksContent(state),
                    ),
                  ],
                );
              },
                  ),
                ),
                // Floating action button for easy access
                Positioned(
                  bottom: 20,
                  right: 20,
                  child: PushButton(
                    controlSize: ControlSize.large,
                    onPressed: _showCreateTaskDialog,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        MacosIcon(CupertinoIcons.plus, size: 16),
                        const SizedBox(width: 8),
                        const Text('New Task'),
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

  Widget _buildFilterBar(TaskState state) {
    int totalTasks = 0;
    int filteredTasks = 0;
    
    if (state is TasksLoaded) {
      totalTasks = state.tasks.length;
      filteredTasks = state.tasks.length;
    }
    
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: MacosTheme.of(context).canvasColor,
        border: Border(
          bottom: BorderSide(
            color: MacosTheme.of(context).dividerColor,
          ),
        ),
      ),
      child: Row(
        children: [
          const Text('Filter: '),
          const SizedBox(width: 8),
          MacosPopupButton<TaskStatus?>(
            value: _filterStatus,
            onChanged: _onFilterChanged,
            items: [
              const MacosPopupMenuItem(
                value: null,
                child: Text('All Tasks'),
              ),
              ...TaskStatus.values.map((status) {
                return MacosPopupMenuItem(
                  value: status,
                  child: Text(status.displayName),
                );
              }),
            ],
          ),
          const Spacer(),
          Text(
            _filterStatus == null 
                ? '$totalTasks tasks'
                : '$filteredTasks ${_filterStatus!.displayName.toLowerCase()} tasks',
            style: const TextStyle(
              color: CupertinoColors.systemGrey,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTasksContent(TaskState state) {
    if (state is TaskLoading) {
      return const Center(child: ProgressCircle());
    } else if (state is TasksLoaded) {
      if (state.tasks.isEmpty) {
        return _buildEmptyState();
      }
      return _buildTasksList(state.tasks);
    } else if (state is TaskError) {
      return _buildErrorState(state.message);
    } else {
      return _buildEmptyState();
    }
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const MacosIcon(
            CupertinoIcons.checkmark_square,
            size: 64,
            color: CupertinoColors.systemGrey,
          ),
          const SizedBox(height: 16),
          Text(
            _filterStatus == null ? 'No Tasks Yet' : 'No ${_filterStatus!.displayName} Tasks',
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: CupertinoColors.systemGrey,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _filterStatus == null 
                ? 'Create your first task to get started'
                : 'No tasks match the current filter',
            style: const TextStyle(
              color: CupertinoColors.systemGrey,
            ),
          ),
          const SizedBox(height: 24),
          PushButton(
            controlSize: ControlSize.large,
            onPressed: _showCreateTaskDialog,
            child: const Text('Create Task'),
          ),
        ],
      ),
    );
  }

  Widget _buildTasksList(List<Task> tasks) {
    return Padding(
      padding: const EdgeInsets.all(20.0),
      child: ListView.builder(
        itemCount: tasks.length,
        itemBuilder: (context, index) {
          final task = tasks[index];
          return _buildTaskCard(task);
        },
      ),
    );
  }

  Widget _buildTaskCard(Task task) {
    Color statusColor;
    IconData statusIcon;
    
    switch (task.status) {
      case TaskStatus.todo:
        statusColor = AppTheme.cancelledColor;
        statusIcon = CupertinoIcons.clock;
        break;
      case TaskStatus.inProgress:
        statusColor = AppTheme.activeColor;
        statusIcon = CupertinoIcons.play_circle;
        break;
      case TaskStatus.review:
        statusColor = AppTheme.planningColor;
        statusIcon = CupertinoIcons.eye;
        break;
      case TaskStatus.blocked:
        statusColor = AppTheme.onHoldColor;
        statusIcon = CupertinoIcons.exclamationmark_circle;
        break;
      case TaskStatus.completed:
        statusColor = AppTheme.completedColor;
        statusIcon = CupertinoIcons.checkmark_circle;
        break;
      case TaskStatus.cancelled:
        statusColor = AppTheme.errorColor;
        statusIcon = CupertinoIcons.xmark_circle;
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
            children: [
              MacosIcon(
                statusIcon,
                color: statusColor,
                size: 20,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  task.title,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    decoration: task.status == TaskStatus.completed
                        ? TextDecoration.lineThrough
                        : null,
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
                  task.status.displayName.toUpperCase(),
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: statusColor,
                  ),
                ),
              ),
            ],
          ),
          if (task.description.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              task.description,
              style: const TextStyle(
                color: CupertinoColors.systemGrey,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (task.dueDate != null)
                    Text(
                      'Due: ${_formatDate(task.dueDate!)}',
                      style: TextStyle(
                        fontSize: 12,
                        color: task.dueDate!.isBefore(DateTime.now())
                            ? CupertinoColors.systemRed
                            : CupertinoColors.systemGrey,
                      ),
                    ),
                  Text(
                    'Created ${_formatDate(task.createdAt)}',
                    style: const TextStyle(
                      fontSize: 12,
                      color: CupertinoColors.systemGrey,
                    ),
                  ),
                ],
              ),
              Row(
                children: [
                  MacosIconButton(
                    icon: const MacosIcon(CupertinoIcons.pencil),
                    onPressed: () => _editTask(task),
                  ),
                  MacosIconButton(
                    icon: const MacosIcon(CupertinoIcons.trash),
                    onPressed: () => _deleteTask(task),
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

  void _editTask(Task task) {
    showCupertinoDialog(

      context: context,
      builder: (context) => EditTaskDialog(task: task),
    );
  }

  void _deleteTask(Task task) {
    showCupertinoDialog(
      context: context,
      builder: (context) => MacosAlertDialog(
        appIcon: const MacosIcon(CupertinoIcons.exclamationmark_triangle),
        title: const Text('Delete Task'),
        message: Text('Are you sure you want to delete "${task.title}"? This action cannot be undone.'),
        primaryButton: PushButton(
          controlSize: ControlSize.large,
          onPressed: () {
            Navigator.of(context).pop();
            context.read<TaskBloc>().add(DeleteTaskEvent(task.id));
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
          const MacosIcon(
            CupertinoIcons.exclamationmark_triangle,
            size: 64,
            color: CupertinoColors.systemRed,
          ),
          const SizedBox(height: 16),
          const Text(
            'Error Loading Tasks',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: CupertinoColors.systemRed,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            message,
            style: const TextStyle(
              color: CupertinoColors.systemGrey,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          PushButton(
            controlSize: ControlSize.large,
            onPressed: () => context.read<TaskBloc>().add(const LoadTasks()),
            child: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  void _showErrorSnackBar(BuildContext context, String message) {
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

class CreateTaskDialog extends StatefulWidget {
  const CreateTaskDialog({super.key});

  @override
  State<CreateTaskDialog> createState() => _CreateTaskDialogState();
}

class _CreateTaskDialogState extends State<CreateTaskDialog> {
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  TaskStatus _selectedStatus = TaskStatus.todo;
  DateTime? _dueDate;
  ProjectSelectionItem? _selectedProject;
  late final ProjectSelectionRepository _projectSelectionRepository;

  @override
  void initState() {
    super.initState();
    _projectSelectionRepository = sl<ProjectSelectionRepository>();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Material(
        color: Colors.transparent,
        child: Container(
          width: 600,
          constraints: const BoxConstraints(maxHeight: 700),
          decoration: BoxDecoration(
            color: MacosTheme.of(context).canvasColor,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: MacosTheme.of(context).dividerColor,
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.1),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Header
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: MacosTheme.of(context).canvasColor,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                  border: Border(
                    bottom: BorderSide(
                      color: MacosTheme.of(context).dividerColor,
                    ),
                  ),
                ),
                child: Row(
                  children: [
                    MacosIcon(
                      CupertinoIcons.plus_square,
                      color: AppTheme.greyMaroonDark,
                      size: 24,
                    ),
                    const SizedBox(width: 12),
                    Text(
                      'Create New Task',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.greyMaroonDark,
                      ),
                    ),
                    const Spacer(),
                    MacosIconButton(
                      icon: const MacosIcon(CupertinoIcons.xmark),
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                  ],
                ),
              ),
              // Content
              Flexible(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      MacosTextField(
                        controller: _titleController,
                        placeholder: 'Task Title',
                      ),
                      const SizedBox(height: 16),
                      MacosTextField(
                        controller: _descriptionController,
                        placeholder: 'Description (optional)',
                        maxLines: 3,
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          const SizedBox(
                            width: 80,
                            child: Text('Project:'),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: ProjectSelectionDropdown(
                              repository: _projectSelectionRepository,
                              selectedProjectId: _selectedProject?.id,
                              onProjectSelected: (project) {
                                setState(() {
                                  _selectedProject = project;
                                });
                              },
                              placeholder: 'Select a project',
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          const SizedBox(
                            width: 80,
                            child: Text('Status:'),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: MacosPopupButton<TaskStatus>(
                              value: _selectedStatus,
                              onChanged: (value) {
                                if (value != null) {
                                  setState(() {
                                    _selectedStatus = value;
                                  });
                                }
                              },
                              items: TaskStatus.values.map((status) {
                                return MacosPopupMenuItem(
                                  value: status,
                                  child: Text(status.displayName),
                                );
                              }).toList(),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          const SizedBox(
                            width: 80,
                            child: Text('Due Date:'),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: PushButton(
                              controlSize: ControlSize.mini,
                              secondary: true,
                              onPressed: () => _selectDueDate(),
                              child: Text(_dueDate == null
                                  ? 'Optional'
                                  : '${_dueDate!.day}/${_dueDate!.month}/${_dueDate!.year}'),
                            ),
                          ),
                          if (_dueDate != null) ...[
                            const SizedBox(width: 8),
                            MacosIconButton(
                              icon: const MacosIcon(CupertinoIcons.xmark_circle_fill),
                              onPressed: () {
                                setState(() {
                                  _dueDate = null;
                                });
                              },
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              // Footer with buttons
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: MacosTheme.of(context).canvasColor,
                  borderRadius: const BorderRadius.vertical(bottom: Radius.circular(12)),
                  border: Border(
                    top: BorderSide(
                      color: MacosTheme.of(context).dividerColor,
                    ),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    PushButton(
                      controlSize: ControlSize.large,
                      secondary: true,
                      onPressed: () => Navigator.of(context).pop(),
                      child: const Text('Cancel'),
                    ),
                    const SizedBox(width: 12),
                    PushButton(
                      controlSize: ControlSize.large,
                      onPressed: _titleController.text.trim().isEmpty || _selectedProject == null
                          ? null
                          : () {
                              final params = CreateTaskParams(
                                title: _titleController.text.trim(),
                                description: _descriptionController.text.trim(),
                                status: _selectedStatus,
                                priority: TaskPriority.medium, // Default priority
                                projectId: _selectedProject?.id ?? '',
                                projectTitle: _selectedProject?.title,
                                dueDate: _dueDate,
                              );
                              context.read<TaskBloc>().add(CreateTaskEvent(params));
                              Navigator.of(context).pop();
                            },
                      child: const Text('Create'),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _selectDueDate() async {
    await showCupertinoModalPopup<DateTime>(
      context: context,
      builder: (context) => Container(
        height: 200,
        color: CupertinoColors.systemBackground,
        child: CupertinoDatePicker(
          mode: CupertinoDatePickerMode.date,
          initialDateTime: _dueDate ?? DateTime.now(),
          minimumDate: DateTime.now(),
          maximumDate: DateTime.now().add(const Duration(days: 365)),
          onDateTimeChanged: (DateTime newDate) {
            setState(() {
              _dueDate = newDate;
            });
          },
        ),
      ),
    );
  }
}

class EditTaskDialog extends StatefulWidget {
  const EditTaskDialog({super.key, required this.task});

  final Task task;

  @override
  State<EditTaskDialog> createState() => _EditTaskDialogState();
}

class _EditTaskDialogState extends State<EditTaskDialog> {
  late final TextEditingController _titleController;
  late final TextEditingController _descriptionController;
  late TaskStatus _selectedStatus;
  late DateTime? _dueDate;
  ProjectSelectionItem? _selectedProject;
  late final ProjectSelectionRepository _projectSelectionRepository;

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController(text: widget.task.title);
    _descriptionController = TextEditingController(text: widget.task.description);
    _selectedStatus = widget.task.status;
    _dueDate = widget.task.dueDate;
    _projectSelectionRepository = sl<ProjectSelectionRepository>();
    
    // Initialize selected project if task has project info
    if (widget.task.projectTitle != null) {
      _selectedProject = ProjectSelectionItem(
        id: widget.task.projectId,
        title: widget.task.projectTitle!,
        status: ProjectStatus.active, // Default assumption for existing tasks
      );
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Material(
        color: Colors.transparent,
        child: Container(
          width: 600,
          constraints: const BoxConstraints(maxHeight: 700),
          decoration: BoxDecoration(
            color: MacosTheme.of(context).canvasColor,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: MacosTheme.of(context).dividerColor,
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.1),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Header
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: MacosTheme.of(context).canvasColor,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                  border: Border(
                    bottom: BorderSide(
                      color: MacosTheme.of(context).dividerColor,
                    ),
                  ),
                ),
                child: Row(
                  children: [
                    MacosIcon(
                      CupertinoIcons.pencil,
                      color: AppTheme.greyMaroonDark,
                      size: 24,
                    ),
                    const SizedBox(width: 12),
                    Text(
                      'Edit Task',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.greyMaroonDark,
                      ),
                    ),
                    const Spacer(),
                    MacosIconButton(
                      icon: const MacosIcon(CupertinoIcons.xmark),
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                  ],
                ),
              ),
              // Content
              Flexible(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      MacosTextField(
                        controller: _titleController,
                        placeholder: 'Task Title',
                      ),
                      const SizedBox(height: 16),
                      MacosTextField(
                        controller: _descriptionController,
                        placeholder: 'Description (optional)',
                        maxLines: 3,
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          const SizedBox(
                            width: 80,
                            child: Text('Project:'),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: ProjectSelectionDropdown(
                              repository: _projectSelectionRepository,
                              selectedProjectId: _selectedProject?.id,
                              onProjectSelected: (project) {
                                setState(() {
                                  _selectedProject = project;
                                });
                              },
                              placeholder: 'Select a project',
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          const SizedBox(
                            width: 80,
                            child: Text('Status:'),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: MacosPopupButton<TaskStatus>(
                              value: _selectedStatus,
                              onChanged: (value) {
                                if (value != null) {
                                  setState(() {
                                    _selectedStatus = value;
                                  });
                                }
                              },
                              items: TaskStatus.values.map((status) {
                                return MacosPopupMenuItem(
                                  value: status,
                                  child: Text(status.displayName),
                                );
                              }).toList(),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          const SizedBox(
                            width: 80,
                            child: Text('Due Date:'),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: PushButton(
                              controlSize: ControlSize.mini,
                              secondary: true,
                              onPressed: () => _selectDueDate(),
                              child: Text(_dueDate == null
                                  ? 'Optional'
                                  : '${_dueDate!.day}/${_dueDate!.month}/${_dueDate!.year}'),
                            ),
                          ),
                          if (_dueDate != null) ...[
                            const SizedBox(width: 8),
                            MacosIconButton(
                              icon: const MacosIcon(CupertinoIcons.xmark_circle_fill),
                              onPressed: () {
                                setState(() {
                                  _dueDate = null;
                                });
                              },
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              // Footer with buttons
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: MacosTheme.of(context).canvasColor,
                  borderRadius: const BorderRadius.vertical(bottom: Radius.circular(12)),
                  border: Border(
                    top: BorderSide(
                      color: MacosTheme.of(context).dividerColor,
                    ),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    PushButton(
                      controlSize: ControlSize.large,
                      secondary: true,
                      onPressed: () => Navigator.of(context).pop(),
                      child: const Text('Cancel'),
                    ),
                    const SizedBox(width: 12),
                    PushButton(
                      controlSize: ControlSize.large,
                      onPressed: _titleController.text.trim().isEmpty || _selectedProject == null
                          ? null
                          : () {
                              final updatedTask = widget.task.copyWith(
                                title: _titleController.text.trim(),
                                description: _descriptionController.text.trim(),
                                status: _selectedStatus,
                                dueDate: _dueDate,
                                projectId: _selectedProject?.id ?? widget.task.projectId,
                                projectTitle: _selectedProject?.title,
                              );
                              context.read<TaskBloc>().add(UpdateTaskEvent(updatedTask));
                              Navigator.of(context).pop();
                            },
                      child: const Text('Save'),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _selectDueDate() async {
    await showCupertinoModalPopup<DateTime>(
      context: context,
      builder: (context) => Container(
        height: 200,
        color: CupertinoColors.systemBackground,
        child: CupertinoDatePicker(
          mode: CupertinoDatePickerMode.date,
          initialDateTime: _dueDate ?? DateTime.now(),
          minimumDate: DateTime.now(),
          maximumDate: DateTime.now().add(const Duration(days: 365)),
          onDateTimeChanged: (DateTime newDate) {
            setState(() {
              _dueDate = newDate;
            });
          },
        ),
      ),
    );
  }
}