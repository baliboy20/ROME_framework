import 'package:flutter/cupertino.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:macos_ui/macos_ui.dart';

import '../../../../core/theme/app_theme.dart';
import '../../domain/entities/blog.dart';
import '../../domain/usecases/create_blog.dart';
import '../bloc/blog_bloc.dart';
import '../bloc/blog_event.dart';
import '../bloc/blog_state.dart';

class BlogsPage extends StatefulWidget {
  const BlogsPage({super.key});

  @override
  State<BlogsPage> createState() => _BlogsPageState();
}

class _BlogsPageState extends State<BlogsPage> {
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    // Load blogs when the page initializes
    context.read<BlogBloc>().add(const LoadBlogs());
  }

  void _showCreateBlogDialog() {
    showCupertinoDialog(
      context: context,
      builder: (context) => const CreateBlogDialog(),
    );
  }

  void _onSearchChanged(String query) {
    setState(() {
      _searchQuery = query;
    });
    
    if (query.trim().isEmpty) {
      context.read<BlogBloc>().add(const LoadBlogs());
    } else {
      context.read<BlogBloc>().add(SearchBlogsEvent(query.trim()));
    }
  }

  @override
  Widget build(BuildContext context) {
    return MacosScaffold(
      toolBar: ToolBar(
        title: Text(
          'Journal',
          style: TextStyle(color: AppTheme.greyMaroonDark),
        ),
        centerTitle: true,
        actions: [
          ToolBarIconButton(
            icon: const MacosIcon(CupertinoIcons.plus),
            onPressed: _showCreateBlogDialog,
            label: 'New Entry',
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
                  child: BlocConsumer<BlogBloc, BlogState>(
              listener: (context, state) {
                if (state is BlogError) {
                  _showErrorSnackBar(context, state.message);
                } else if (state is BlogCreated) {
                  _showSuccessSnackBar(context, 'Blog entry created successfully');
                } else if (state is BlogUpdated) {
                  _showSuccessSnackBar(context, 'Blog entry updated successfully');
                } else if (state is BlogDeleted) {
                  _showSuccessSnackBar(context, 'Blog entry deleted successfully');
                }
              },
              builder: (context, state) {
                return Column(
                  children: [
                    _buildSearchBar(state),
                    Expanded(
                      child: _buildBlogsContent(state),
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
                    onPressed: _showCreateBlogDialog,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        MacosIcon(CupertinoIcons.plus, size: 16),
                        const SizedBox(width: 8),
                        const Text('New Entry'),
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

  Widget _buildSearchBar(BlogState state) {
    int totalBlogs = 0;
    int displayedBlogs = 0;
    bool isSearchResult = false;
    
    if (state is BlogsLoaded) {
      totalBlogs = state.blogs.length;
      displayedBlogs = state.blogs.length;
      isSearchResult = state.isSearchResult;
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
          Expanded(
            child: MacosSearchField(
              placeholder: 'Search journal entries...',
              onChanged: _onSearchChanged,
            ),
          ),
          const SizedBox(width: 16),
          Text(
            isSearchResult && _searchQuery.isNotEmpty
                ? '$displayedBlogs results for "$_searchQuery"'
                : '$totalBlogs entries',
            style: const TextStyle(
              color: CupertinoColors.systemGrey,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBlogsContent(BlogState state) {
    if (state is BlogLoading) {
      return const Center(child: ProgressCircle());
    } else if (state is BlogsLoaded) {
      if (state.blogs.isEmpty) {
        return _buildEmptyState();
      }
      return _buildBlogsList(state.blogs);
    } else if (state is BlogError) {
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
            CupertinoIcons.book,
            size: 64,
            color: CupertinoColors.systemGrey,
          ),
          const SizedBox(height: 16),
          Text(
            _searchQuery.isEmpty ? 'No Journal Entries Yet' : 'No Matching Entries',
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: CupertinoColors.systemGrey,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _searchQuery.isEmpty 
                ? 'Start documenting your thoughts and progress'
                : 'Try adjusting your search terms',
            style: const TextStyle(
              color: CupertinoColors.systemGrey,
            ),
          ),
          const SizedBox(height: 24),
          PushButton(
            controlSize: ControlSize.large,
            onPressed: _showCreateBlogDialog,
            child: const Text('New Entry'),
          ),
        ],
      ),
    );
  }

  Widget _buildBlogsList(List<Blog> blogs) {
    return Padding(
      padding: const EdgeInsets.all(20.0),
      child: ListView.builder(
        itemCount: blogs.length,
        itemBuilder: (context, index) {
          final blog = blogs[index];
          return _buildBlogCard(blog);
        },
      ),
    );
  }

  Widget _buildBlogCard(Blog blog) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: MacosTheme.of(context).canvasColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: MacosTheme.of(context).dividerColor,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  blog.title,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              Text(
                _formatDate(blog.createdAt),
                style: const TextStyle(
                  fontSize: 14,
                  color: CupertinoColors.systemGrey,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            blog.content.length > 200 
                ? '${blog.content.substring(0, 200)}...'
                : blog.content,
            style: const TextStyle(
              fontSize: 14,
              height: 1.5,
            ),
          ),
          if (blog.tags.isNotEmpty) ...[
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 4,
              children: blog.tags.map((tag) {
                return Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: CupertinoColors.systemBlue.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: CupertinoColors.systemBlue.withOpacity(0.3),
                    ),
                  ),
                  child: Text(
                    tag,
                    style: const TextStyle(
                      fontSize: 12,
                      color: CupertinoColors.systemBlue,
                    ),
                  ),
                );
              }).toList(),
            ),
          ],
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Last updated ${_formatDate(blog.updatedAt)}',
                style: const TextStyle(
                  fontSize: 12,
                  color: CupertinoColors.systemGrey,
                ),
              ),
              Row(
                children: [
                  MacosIconButton(
                    icon: const MacosIcon(CupertinoIcons.eye),
                    onPressed: () => _viewBlog(blog),
                  ),
                  MacosIconButton(
                    icon: const MacosIcon(CupertinoIcons.pencil),
                    onPressed: () => _editBlog(blog),
                  ),
                  MacosIconButton(
                    icon: const MacosIcon(CupertinoIcons.trash),
                    onPressed: () => _deleteBlog(blog),
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

  void _viewBlog(Blog blog) {
    showCupertinoDialog(
      context: context,
      builder: (context) => ViewBlogDialog(blog: blog),
    );
  }

  void _editBlog(Blog blog) {
    showCupertinoDialog(
      context: context,
      builder: (context) => EditBlogDialog(blog: blog),
    );
  }

  void _deleteBlog(Blog blog) {
    showCupertinoDialog(
      context: context,
      builder: (context) => MacosAlertDialog(
        appIcon: const MacosIcon(CupertinoIcons.exclamationmark_triangle),
        title: const Text('Delete Entry'),
        message: Text('Are you sure you want to delete "${blog.title}"? This action cannot be undone.'),
        primaryButton: PushButton(
          controlSize: ControlSize.large,
          onPressed: () {
            Navigator.of(context).pop();
            context.read<BlogBloc>().add(DeleteBlogEvent(blog.id));
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
            'Error Loading Journal Entries',
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
            onPressed: () => context.read<BlogBloc>().add(const LoadBlogs()),
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

class CreateBlogDialog extends StatefulWidget {
  const CreateBlogDialog({super.key});

  @override
  State<CreateBlogDialog> createState() => _CreateBlogDialogState();
}

class _CreateBlogDialogState extends State<CreateBlogDialog> {
  final _titleController = TextEditingController();
  final _contentController = TextEditingController();
  final _tagsController = TextEditingController();

  @override
  void initState() {
    super.initState();
    // Add listeners to rebuild the widget when text changes
    _titleController.addListener(_onTextChanged);
    _contentController.addListener(_onTextChanged);
  }

  void _onTextChanged() {
    setState(() {
      // This will rebuild the widget and update the button state
    });
  }

  bool get _isFormValid {
    return _titleController.text.trim().isNotEmpty &&
           _contentController.text.trim().isNotEmpty;
  }

  @override
  void dispose() {
    _titleController.removeListener(_onTextChanged);
    _contentController.removeListener(_onTextChanged);
    _titleController.dispose();
    _contentController.dispose();
    _tagsController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MacosSheet(
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'New Journal Entry',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 20),
            MacosTextField(
              controller: _titleController,
              placeholder: 'Entry Title',
            ),
            const SizedBox(height: 16),
            MacosTextField(
              controller: _contentController,
              placeholder: 'Write your thoughts...',
              maxLines: 10,
            ),
            const SizedBox(height: 16),
            MacosTextField(
              controller: _tagsController,
              placeholder: 'Tags (comma separated)',
            ),
            const SizedBox(height: 24),
            Row(
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
                  onPressed: !_isFormValid
                      ? null
                      : () {
                          final tags = _tagsController.text.trim().isEmpty
                              ? <String>[]
                              : _tagsController.text
                                  .split(',')
                                  .map((tag) => tag.trim())
                                  .where((tag) => tag.isNotEmpty)
                                  .toList();
                          
                          final params = CreateBlogParams(
                            title: _titleController.text.trim(),
                            content: _contentController.text.trim(),
                            status: BlogStatus.draft, // Default to draft
                            tags: tags,
                          );
                          
                          context.read<BlogBloc>().add(CreateBlogEvent(params));
                          Navigator.of(context).pop();
                        },
                  child: const Text('Create'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class EditBlogDialog extends StatefulWidget {
  const EditBlogDialog({super.key, required this.blog});

  final Blog blog;

  @override
  State<EditBlogDialog> createState() => _EditBlogDialogState();
}

class _EditBlogDialogState extends State<EditBlogDialog> {
  late final TextEditingController _titleController;
  late final TextEditingController _contentController;
  late final TextEditingController _tagsController;

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController(text: widget.blog.title);
    _contentController = TextEditingController(text: widget.blog.content);
    _tagsController = TextEditingController(text: widget.blog.tags.join(', '));
    
    // Add listeners to rebuild the widget when text changes
    _titleController.addListener(_onTextChanged);
    _contentController.addListener(_onTextChanged);
  }

  void _onTextChanged() {
    setState(() {
      // This will rebuild the widget and update the button state
    });
  }

  bool get _isFormValid {
    return _titleController.text.trim().isNotEmpty &&
           _contentController.text.trim().isNotEmpty;
  }

  @override
  void dispose() {
    _titleController.removeListener(_onTextChanged);
    _contentController.removeListener(_onTextChanged);
    _titleController.dispose();
    _contentController.dispose();
    _tagsController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MacosSheet(
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Edit Journal Entry',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 20),
            MacosTextField(
              controller: _titleController,
              placeholder: 'Entry Title',
            ),
            const SizedBox(height: 16),
            MacosTextField(
              controller: _contentController,
              placeholder: 'Write your thoughts...',
              maxLines: 10,
            ),
            const SizedBox(height: 16),
            MacosTextField(
              controller: _tagsController,
              placeholder: 'Tags (comma separated)',
            ),
            const SizedBox(height: 24),
            Row(
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
                  onPressed: !_isFormValid
                      ? null
                      : () {
                          final tags = _tagsController.text.trim().isEmpty
                              ? <String>[]
                              : _tagsController.text
                                  .split(',')
                                  .map((tag) => tag.trim())
                                  .where((tag) => tag.isNotEmpty)
                                  .toList();
                          
                          final updatedBlog = widget.blog.copyWith(
                            title: _titleController.text.trim(),
                            content: _contentController.text.trim(),
                            tags: tags,
                          );
                          
                          context.read<BlogBloc>().add(UpdateBlogEvent(updatedBlog));
                          Navigator.of(context).pop();
                        },
                  child: const Text('Save'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class ViewBlogDialog extends StatelessWidget {
  const ViewBlogDialog({super.key, required this.blog});

  final Blog blog;

  @override
  Widget build(BuildContext context) {
    return MacosSheet(
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    blog.title,
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                MacosIconButton(
                  icon: const MacosIcon(CupertinoIcons.xmark),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'Created: ${_formatDate(blog.createdAt)}',
              style: const TextStyle(
                color: CupertinoColors.systemGrey,
                fontSize: 14,
              ),
            ),
            if (blog.updatedAt != blog.createdAt)
              Text(
                'Updated: ${_formatDate(blog.updatedAt)}',
                style: const TextStyle(
                  color: CupertinoColors.systemGrey,
                  fontSize: 14,
                ),
              ),
            const SizedBox(height: 20),
            Container(
              constraints: const BoxConstraints(maxHeight: 400),
              child: SingleChildScrollView(
                child: Text(
                  blog.content,
                  style: const TextStyle(
                    fontSize: 14,
                    height: 1.5,
                  ),
                ),
              ),
            ),
            if (blog.tags.isNotEmpty) ...[
              const SizedBox(height: 20),
              const Text(
                'Tags:',
                style: TextStyle(
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 4,
                children: blog.tags.map((tag) {
                  return Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: CupertinoColors.systemBlue.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: CupertinoColors.systemBlue.withOpacity(0.3),
                      ),
                    ),
                    child: Text(
                      tag,
                      style: const TextStyle(
                        fontSize: 12,
                        color: CupertinoColors.systemBlue,
                      ),
                    ),
                  );
                }).toList(),
              ),
            ],
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year} at ${date.hour}:${date.minute.toString().padLeft(2, '0')}';
  }
}