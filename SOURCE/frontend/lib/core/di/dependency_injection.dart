import '../../features/blog/data/repositories/blog_repository_impl.dart';
import '../../features/blog/domain/repositories/blog_repository.dart';
import '../../features/blog/domain/usecases/create_blog.dart';
import '../../features/blog/domain/usecases/delete_blog.dart';
import '../../features/blog/domain/usecases/get_all_blogs.dart';
import '../../features/blog/domain/usecases/search_blogs.dart';
import '../../features/blog/domain/usecases/update_blog.dart';
import '../../features/blog/presentation/bloc/blog_bloc.dart';
import '../../features/project/data/repositories/project_repository_impl.dart';
import '../../features/project/domain/repositories/project_repository.dart';
import '../../features/project/domain/usecases/create_project.dart';
import '../../features/project/domain/usecases/delete_project.dart' as delete_uc;
import '../../features/project/domain/usecases/get_all_projects.dart';
import '../../features/project/domain/usecases/get_project_by_id.dart';
import '../../features/project/domain/usecases/update_project.dart' as update_uc;
import '../../features/project/presentation/bloc/project_bloc.dart';
import '../../features/task/data/repositories/task_repository_impl.dart';
import '../../features/task/domain/repositories/task_repository.dart';
import '../../features/task/domain/usecases/create_task.dart';
import '../../features/task/domain/usecases/delete_task.dart';
import '../../features/task/domain/usecases/get_all_tasks.dart';
import '../../features/task/domain/usecases/get_tasks_by_status.dart';
import '../../features/task/domain/usecases/update_task.dart';
import '../../features/task/presentation/bloc/task_bloc.dart';
import '../../main.dart';
import '../network/dio_client.dart';

class DependencyInjection {
  static late DioClient _dioClient;
  
  // Repositories
  static late ProjectRepository _projectRepository;
  static late TaskRepository _taskRepository;
  static late BlogRepository _blogRepository;
  
  // Use Cases - Project
  static late GetAllProjects _getAllProjects;
  static late GetProjectById _getProjectById;
  static late CreateProject _createProject;
  static late update_uc.UpdateProject _updateProject;
  static late delete_uc.DeleteProject _deleteProject;
  
  // Use Cases - Task
  static late GetAllTasks _getAllTasks;
  static late GetTasksByStatus _getTasksByStatus;
  static late CreateTask _createTask;
  static late UpdateTask _updateTask;
  static late DeleteTask _deleteTask;
  
  // Use Cases - Blog
  static late GetAllBlogs _getAllBlogs;
  static late SearchBlogs _searchBlogs;
  static late CreateBlog _createBlog;
  static late UpdateBlog _updateBlog;
  static late DeleteBlog _deleteBlog;
  
  static Future<void> init(DioClient dioClient) async {
    _dioClient = dioClient;
    
    // Initialize repositories
    _projectRepository = ProjectRepositoryImpl(dioClient: _dioClient, logger: logger);
    _taskRepository = TaskRepositoryImpl(_dioClient);
    _blogRepository = BlogRepositoryImpl(_dioClient);
    
    // Initialize use cases - Project
    _getAllProjects = GetAllProjects(_projectRepository);
    _getProjectById = GetProjectById(_projectRepository);
    _createProject = CreateProject(_projectRepository);
    _updateProject = update_uc.UpdateProject(_projectRepository);
    _deleteProject = delete_uc.DeleteProject(_projectRepository);
    
    // Initialize use cases - Task
    _getAllTasks = GetAllTasks(_taskRepository);
    _getTasksByStatus = GetTasksByStatus(_taskRepository);
    _createTask = CreateTask(_taskRepository);
    _updateTask = UpdateTask(_taskRepository);
    _deleteTask = DeleteTask(_taskRepository);
    
    // Initialize use cases - Blog
    _getAllBlogs = GetAllBlogs(_blogRepository);
    _searchBlogs = SearchBlogs(_blogRepository);
    _createBlog = CreateBlog(_blogRepository);
    _updateBlog = UpdateBlog(_blogRepository);
    _deleteBlog = DeleteBlog(_blogRepository);
  }
  
  // Project dependencies
  static ProjectBloc createProjectBloc() {
    return ProjectBloc(
      getAllProjects: _getAllProjects,
      getProjectById: _getProjectById,
      createProject: _createProject,
      updateProject: _updateProject,
      deleteProject: _deleteProject,
    );
  }
  
  // Task dependencies
  static TaskBloc createTaskBloc() {
    return TaskBloc(
      getAllTasks: _getAllTasks,
      getTasksByStatus: _getTasksByStatus,
      createTask: _createTask,
      updateTask: _updateTask,
      deleteTask: _deleteTask,
    );
  }
  
  // Blog dependencies
  static BlogBloc createBlogBloc() {
    return BlogBloc(
      getAllBlogs: _getAllBlogs,
      searchBlogs: _searchBlogs,
      createBlog: _createBlog,
      updateBlog: _updateBlog,
      deleteBlog: _deleteBlog,
    );
  }
}