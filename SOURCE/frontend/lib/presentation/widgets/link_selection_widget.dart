import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

class LinkSelectionWidget extends StatefulWidget {
  final List<String> allLinks;
  final List<String> flutterLinks;
  final Function(List<String>) onSelectionChanged;
  final VoidCallback? onProcessSelected;

  const LinkSelectionWidget({
    super.key,
    required this.allLinks,
    required this.flutterLinks,
    required this.onSelectionChanged,
    this.onProcessSelected,
  });

  @override
  State<LinkSelectionWidget> createState() => _LinkSelectionWidgetState();
}

class _LinkSelectionWidgetState extends State<LinkSelectionWidget> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final Set<String> _selectedLinks = <String>{};
  String _searchQuery = '';
  
  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    
    // Pre-select Flutter links
    _selectedLinks.addAll(widget.flutterLinks);
    widget.onSelectionChanged(_selectedLinks.toList());
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  List<String> get _filteredAllLinks {
    if (_searchQuery.isEmpty) return widget.allLinks;
    return widget.allLinks
        .where((link) => link.toLowerCase().contains(_searchQuery.toLowerCase()))
        .toList();
  }

  List<String> get _filteredFlutterLinks {
    if (_searchQuery.isEmpty) return widget.flutterLinks;
    return widget.flutterLinks
        .where((link) => link.toLowerCase().contains(_searchQuery.toLowerCase()))
        .toList();
  }

  void _toggleLinkSelection(String link) {
    setState(() {
      if (_selectedLinks.contains(link)) {
        _selectedLinks.remove(link);
      } else {
        _selectedLinks.add(link);
      }
    });
    widget.onSelectionChanged(_selectedLinks.toList());
  }

  void _selectAll(List<String> links) {
    setState(() {
      _selectedLinks.addAll(links);
    });
    widget.onSelectionChanged(_selectedLinks.toList());
  }

  void _deselectAll(List<String> links) {
    setState(() {
      _selectedLinks.removeWhere((link) => links.contains(link));
    });
    widget.onSelectionChanged(_selectedLinks.toList());
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 500,
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Theme.of(context).colorScheme.outline.withOpacity(0.2),
        ),
      ),
      child: Column(
        children: [
          // Header with search and selection info
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.5),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(12),
                topRight: Radius.circular(12),
              ),
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    Icon(
                      CupertinoIcons.link,
                      size: 20,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Select Links to Process',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontFamily: 'Comic Sans MS',
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.primaryContainer,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Text(
                        '${_selectedLinks.length} selected',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: Theme.of(context).colorScheme.onPrimaryContainer,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                // Search bar
                TextField(
                  onChanged: (value) => setState(() => _searchQuery = value),
                  decoration: InputDecoration(
                    hintText: 'Search links...',
                    prefixIcon: const Icon(CupertinoIcons.search, size: 20),
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(CupertinoIcons.xmark_circle_fill, size: 20),
                            onPressed: () => setState(() => _searchQuery = ''),
                          )
                        : null,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide(
                        color: Theme.of(context).colorScheme.outline.withOpacity(0.3),
                      ),
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    isDense: true,
                  ),
                  style: const TextStyle(fontSize: 14),
                ),
              ],
            ),
          ),
          
          // Tab bar
          Container(
            color: Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.3),
            child: TabBar(
              controller: _tabController,
              tabs: [
                Tab(
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(CupertinoIcons.star_fill, size: 16),
                      const SizedBox(width: 6),
                      Text(
                        'Flutter Links (${_filteredFlutterLinks.length})',
                        style: const TextStyle(fontSize: 13),
                      ),
                    ],
                  ),
                ),
                Tab(
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(CupertinoIcons.link, size: 16),
                      const SizedBox(width: 6),
                      Text(
                        'All Links (${_filteredAllLinks.length})',
                        style: const TextStyle(fontSize: 13),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          // Tab content
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildLinkList(_filteredFlutterLinks, isFlutterTab: true),
                _buildLinkList(_filteredAllLinks, isFlutterTab: false),
              ],
            ),
          ),
          
          // Bottom action bar
          if (_selectedLinks.isNotEmpty) ...[
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.primaryContainer.withOpacity(0.5),
                border: Border(
                  top: BorderSide(
                    color: Theme.of(context).colorScheme.outline.withOpacity(0.2),
                  ),
                ),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      '${_selectedLinks.length} link${_selectedLinks.length == 1 ? '' : 's'} selected for processing',
                      style: TextStyle(
                        fontFamily: 'Comic Sans MS',
                        fontWeight: FontWeight.w500,
                        color: Theme.of(context).colorScheme.onPrimaryContainer,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  CupertinoButton.filled(
                    onPressed: widget.onProcessSelected,
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          CupertinoIcons.cloud_download,
                          size: 16,
                          color: Colors.white,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Process Selected',
                          style: const TextStyle(
                            fontFamily: 'Comic Sans MS',
                            fontWeight: FontWeight.w500,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildLinkList(List<String> links, {required bool isFlutterTab}) {
    if (links.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              CupertinoIcons.link,
              size: 48,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              _searchQuery.isNotEmpty ? 'No links match your search' : 'No links found',
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                fontFamily: 'Comic Sans MS',
                color: Colors.grey[600],
                fontStyle: FontStyle.italic,
              ),
            ),
          ],
        ),
      );
    }

    return Column(
      children: [
        // Select/Deselect all buttons
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            children: [
              TextButton.icon(
                icon: const Icon(CupertinoIcons.checkmark_circle, size: 16),
                label: const Text('Select All'),
                onPressed: () => _selectAll(links),
                style: TextButton.styleFrom(
                  textStyle: const TextStyle(fontSize: 12),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                ),
              ),
              const SizedBox(width: 8),
              TextButton.icon(
                icon: const Icon(CupertinoIcons.xmark_circle, size: 16),
                label: const Text('Deselect All'),
                onPressed: () => _deselectAll(links),
                style: TextButton.styleFrom(
                  textStyle: const TextStyle(fontSize: 12),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                ),
              ),
              const Spacer(),
              Text(
                '${links.where((link) => _selectedLinks.contains(link)).length}/${links.length} selected',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
                ),
              ),
            ],
          ),
        ),
        const Divider(height: 1),
        
        // Links list
        Expanded(
          child: ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: links.length,
            separatorBuilder: (context, index) => const SizedBox(height: 8),
            itemBuilder: (context, index) {
              final link = links[index];
              final isSelected = _selectedLinks.contains(link);
              final isFlutterLink = widget.flutterLinks.contains(link);
              
              return Container(
                decoration: BoxDecoration(
                  color: isSelected 
                      ? Theme.of(context).colorScheme.primaryContainer.withOpacity(0.3)
                      : Theme.of(context).colorScheme.surface,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: isSelected 
                        ? Theme.of(context).colorScheme.primary.withOpacity(0.3)
                        : Theme.of(context).colorScheme.outline.withOpacity(0.2),
                  ),
                ),
                child: InkWell(
                  onTap: () => _toggleLinkSelection(link),
                  borderRadius: BorderRadius.circular(8),
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Row(
                      children: [
                        // Selection checkbox
                        Icon(
                          isSelected ? CupertinoIcons.checkmark_circle_fill : CupertinoIcons.circle,
                          size: 20,
                          color: isSelected 
                              ? Theme.of(context).colorScheme.primary
                              : Theme.of(context).colorScheme.outline,
                        ),
                        const SizedBox(width: 12),
                        
                        // Flutter indicator
                        if (isFlutterLink && !isFlutterTab) ...[
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: Colors.blue.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: const Text(
                              'Flutter',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: Colors.blue,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                        ],
                        
                        // Link URL
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _getDomainFromUrl(link),
                                style: TextStyle(
                                  fontFamily: 'Comic Sans MS',
                                  fontWeight: FontWeight.w600,
                                  fontSize: 13,
                                  color: Theme.of(context).colorScheme.primary,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                link,
                                style: TextStyle(
                                  fontFamily: 'Comic Sans MS',
                                  fontSize: 12,
                                  color: Theme.of(context).colorScheme.onSurface.withOpacity(0.7),
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                        
                        // Selection indicator
                        if (isSelected) ...[
                          const SizedBox(width: 12),
                          Icon(
                            CupertinoIcons.checkmark,
                            size: 16,
                            color: Theme.of(context).colorScheme.primary,
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  String _getDomainFromUrl(String url) {
    try {
      final uri = Uri.parse(url);
      return uri.host;
    } catch (e) {
      return 'Invalid URL';
    }
  }
}