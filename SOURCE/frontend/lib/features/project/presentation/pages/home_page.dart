import 'package:flutter/cupertino.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:macos_ui/macos_ui.dart';

import '../../../../core/theme/app_theme.dart';
import 'projects_page.dart';
import '../../../task/presentation/pages/tasks_page.dart';
import '../../../blog/presentation/pages/blogs_page.dart';
import '../bloc/project_bloc.dart';
import '../bloc/project_event.dart';
import '../bloc/project_state.dart';
import '../../../task/presentation/bloc/task_bloc.dart';
import '../../../task/presentation/bloc/task_event.dart';
import '../../../task/presentation/bloc/task_state.dart';
import '../../../blog/presentation/bloc/blog_bloc.dart';
import '../../../blog/presentation/bloc/blog_event.dart';
import '../../../blog/presentation/bloc/blog_state.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _selectedIndex = 0;

  @override
  void initState() {
    super.initState();
    // Load data when app starts
    _loadDashboardData();
  }

  void _loadDashboardData() {
    context.read<ProjectBloc>().add(LoadProjects());
    context.read<TaskBloc>().add(LoadTasks());
    context.read<BlogBloc>().add(LoadBlogs());
  }

  List<SidebarItem> get _sidebarItems => [
    SidebarItem(
      leading: MacosIcon(
        CupertinoIcons.home,
        color: AppTheme.greyMaroon,
      ),
      label: Text(
        'Dashboard',
        style: TextStyle(color: AppTheme.greyMaroonDark),
      ),
    ),
    SidebarItem(
      leading: MacosIcon(
        CupertinoIcons.folder,
        color: AppTheme.greyMaroon,
      ),
      label: Text(
        'Projects',
        style: TextStyle(color: AppTheme.greyMaroonDark),
      ),
    ),
    SidebarItem(
      leading: MacosIcon(
        CupertinoIcons.checkmark_square,
        color: AppTheme.greyMaroon,
      ),
      label: Text(
        'Tasks',
        style: TextStyle(color: AppTheme.greyMaroonDark),
      ),
    ),
    SidebarItem(
      leading: MacosIcon(
        CupertinoIcons.book,
        color: AppTheme.greyMaroon,
      ),
      label: Text(
        'Journal',
        style: TextStyle(color: AppTheme.greyMaroonDark),
      ),
    ),
  ];


  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppTheme.paleStraw,
      child: MacosWindow(
        sidebar: Sidebar(
          minWidth: 200,
          builder: (context, scrollController) {
            return Container(
              color: AppTheme.paleStrawDark,
              child: SidebarItems(
                currentIndex: _selectedIndex,
                onChanged: (index) {
                  setState(() {
                    _selectedIndex = index;
                  });
                  // Reload data when returning to dashboard
                  if (index == 0) {
                    _loadDashboardData();
                  }
                },
                items: _sidebarItems,
                itemSize: SidebarItemSize.large,
              ),
            );
          },
        ),
        child: Container(
          color: AppTheme.paleStraw,
          child: IndexedStack(
            index: _selectedIndex,
            children: [
              const DashboardView(),
              const ProjectsPage(),
              const TasksPage(),
              const BlogsPage(),
            ],
          ),
        ),
      ),
    );
  }
}

class DashboardView extends StatefulWidget {
  const DashboardView({super.key});

  @override
  State<DashboardView> createState() => _DashboardViewState();
}

class _DashboardViewState extends State<DashboardView> {

  @override
  Widget build(BuildContext context) {
    return MacosScaffold(
      toolBar: ToolBar(
        title: Text(
          'Dashboard',
          style: TextStyle(color: AppTheme.greyMaroonDark),
        ),
        centerTitle: true,
      ),
      children: [
        ContentArea(
          builder: (context, scrollController) {
            return Container(
              color: AppTheme.paleStraw,
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Welcome to Project Management',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'Quick Overview',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: BlocBuilder<ProjectBloc, ProjectState>(
                          builder: (context, state) {
                            String count = '0';
                            if (state is ProjectsLoaded) {
                              count = state.projects.length.toString();
                            }
                            return _buildDashboardCard(
                              'Projects',
                              count,
                              CupertinoIcons.folder,
                              AppTheme.activeColor,
                            );
                          },
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: BlocBuilder<TaskBloc, TaskState>(
                          builder: (context, state) {
                            String count = '0';
                            if (state is TasksLoaded) {
                              count = state.tasks.length.toString();
                            }
                            return _buildDashboardCard(
                              'Tasks',
                              count,
                              CupertinoIcons.checkmark_square,
                              AppTheme.successColor,
                            );
                          },
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: BlocBuilder<BlogBloc, BlogState>(
                          builder: (context, state) {
                            String count = '0';
                            if (state is BlogsLoaded) {
                              count = state.blogs.length.toString();
                            }
                            return _buildDashboardCard(
                              'Journal Entries',
                              count,
                              CupertinoIcons.book,
                              AppTheme.warningColor,
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),
                  const Text(
                    'Recent Activity',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 16),
                  _buildRecentActivitySection(),
                ],
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildRecentActivitySection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.paleStrawDark,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: AppTheme.greyMaroonLight.withValues(alpha: 0.3),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Recent Projects
          BlocBuilder<ProjectBloc, ProjectState>(
            builder: (context, state) {
              if (state is ProjectsLoaded && state.projects.isNotEmpty) {
                final recentProject = state.projects.first;
                return _buildActivityItem(
                  'Project Created',
                  recentProject.title,
                  CupertinoIcons.folder,
                  AppTheme.activeColor,
                );
              }
              return const SizedBox.shrink();
            },
          ),
          
          // Recent Tasks
          BlocBuilder<TaskBloc, TaskState>(
            builder: (context, state) {
              if (state is TasksLoaded && state.tasks.isNotEmpty) {
                final recentTask = state.tasks.first;
                return Padding(
                  padding: const EdgeInsets.only(top: 12),
                  child: _buildActivityItem(
                    'Task ${recentTask.status}',
                    recentTask.title,
                    CupertinoIcons.checkmark_square,
                    AppTheme.successColor,
                  ),
                );
              }
              return const SizedBox.shrink();
            },
          ),
          
          // Recent Journal Entries
          BlocBuilder<BlogBloc, BlogState>(
            builder: (context, state) {
              if (state is BlogsLoaded && state.blogs.isNotEmpty) {
                final recentBlog = state.blogs.first;
                return Padding(
                  padding: const EdgeInsets.only(top: 12),
                  child: _buildActivityItem(
                    'Journal Entry',
                    recentBlog.title,
                    CupertinoIcons.book,
                    AppTheme.warningColor,
                  ),
                );
              }
              return const SizedBox.shrink();
            },
          ),
          
          // Empty state when no data
          BlocBuilder<ProjectBloc, ProjectState>(
            builder: (context, projectState) {
              return BlocBuilder<TaskBloc, TaskState>(
                builder: (context, taskState) {
                  return BlocBuilder<BlogBloc, BlogState>(
                    builder: (context, blogState) {
                      final hasProjects = projectState is ProjectsLoaded && projectState.projects.isNotEmpty;
                      final hasTasks = taskState is TasksLoaded && taskState.tasks.isNotEmpty;
                      final hasBlogs = blogState is BlogsLoaded && blogState.blogs.isNotEmpty;
                      
                      if (!hasProjects && !hasTasks && !hasBlogs) {
                        return const Center(
                          child: Text(
                            'No recent activity\nCreate your first project, task, or journal entry to see activity here.',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: CupertinoColors.systemGrey,
                            ),
                          ),
                        );
                      }
                      return const SizedBox.shrink();
                    },
                  );
                },
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildActivityItem(String action, String title, IconData icon, Color color) {
    return Row(
      children: [
        Icon(
          icon,
          color: color,
          size: 20,
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                action,
                style: TextStyle(
                  fontSize: 12,
                  color: AppTheme.lightText,
                  fontWeight: FontWeight.w500,
                ),
              ),
              Text(
                title,
                style: TextStyle(
                  fontSize: 14,
                  color: AppTheme.darkText,
                  fontWeight: FontWeight.w600,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildDashboardCard(
    String title,
    String count,
    IconData icon,
    Color color,
  ) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: color.withValues(alpha: 0.3),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Icon(
                icon,
                color: color,
                size: 24,
              ),
              Text(
                count,
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            title,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}