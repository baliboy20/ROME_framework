import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

class HyperlinkSelectorDialog extends StatefulWidget {
  final Map<String, dynamic> email;
  final Function(List<String> selectedLinks) onLinksSelected;

  const HyperlinkSelectorDialog({
    super.key,
    required this.email,
    required this.onLinksSelected,
  });

  @override
  State<HyperlinkSelectorDialog> createState() => _HyperlinkSelectorDialogState();
}

class _HyperlinkSelectorDialogState extends State<HyperlinkSelectorDialog> {
  final Set<String> _selectedLinks = <String>{};
  late List<String> _allLinks;
  String _searchQuery = '';
  
  @override
  void initState() {
    super.initState();
    // Extract all links from the email
    _allLinks = _extractAllLinks();
  }
  
  List<String> _extractAllLinks() {
    final List<String> links = [];
    
    // Get links from allLinks array
    if (widget.email['allLinks'] != null) {
      for (final link in widget.email['allLinks'] as List) {
        final linkStr = link.toString().trim();
        if (linkStr.isNotEmpty && !links.contains(linkStr)) {
          links.add(linkStr);
        }
      }
    }
    
    // Also check flutterLinks if available
    if (widget.email['flutterLinks'] != null) {
      for (final link in widget.email['flutterLinks'] as List) {
        final linkStr = link.toString().trim();
        if (linkStr.isNotEmpty && !links.contains(linkStr)) {
          links.add(linkStr);
        }
      }
    }
    
    // Remove duplicates and sort
    return links.toSet().toList()..sort();
  }
  
  List<String> _getFilteredLinks() {
    if (_searchQuery.isEmpty) {
      return _allLinks;
    }
    return _allLinks.where((link) => 
      link.toLowerCase().contains(_searchQuery.toLowerCase())
    ).toList();
  }
  
  String _getDomainFromUrl(String url) {
    try {
      final uri = Uri.parse(url);
      return uri.host;
    } catch (e) {
      return 'Unknown';
    }
  }
  
  Widget _buildLinkItem(String link, int index) {
    final isSelected = _selectedLinks.contains(link);
    final domain = _getDomainFromUrl(link);
    
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      elevation: 0,
      color: isSelected 
        ? Theme.of(context).colorScheme.primaryContainer.withOpacity(0.3)
        : Theme.of(context).colorScheme.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: BorderSide(
          color: isSelected 
            ? Theme.of(context).colorScheme.primary
            : Theme.of(context).colorScheme.outline.withOpacity(0.2),
          width: isSelected ? 2 : 0.5,
        ),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(8),
        onTap: () {
          setState(() {
            if (isSelected) {
              _selectedLinks.remove(link);
            } else {
              _selectedLinks.add(link);
            }
          });
        },
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              // Checkbox
              Container(
                width: 20,
                height: 20,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: isSelected 
                      ? Theme.of(context).colorScheme.primary
                      : Theme.of(context).colorScheme.outline,
                    width: 2,
                  ),
                  color: isSelected 
                    ? Theme.of(context).colorScheme.primary
                    : Colors.transparent,
                ),
                child: isSelected 
                  ? const Icon(
                      CupertinoIcons.checkmark,
                      size: 12,
                      color: Colors.white,
                    )
                  : null,
              ),
              const SizedBox(width: 12),
              
              // Link content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Domain
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.secondaryContainer.withOpacity(0.5),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        domain,
                        style: TextStyle(
                          fontFamily: 'Comic Sans MS',
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: Theme.of(context).colorScheme.onSecondaryContainer,
                        ),
                      ),
                    ),
                    const SizedBox(height: 6),
                    
                    // Full URL
                    Text(
                      link,
                      style: TextStyle(
                        fontFamily: 'Comic Sans MS',
                        fontSize: 12,
                        color: Theme.of(context).colorScheme.onSurface,
                        decoration: TextDecoration.underline,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              
              // Index number
              Container(
                margin: const EdgeInsets.only(left: 8),
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.outline.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '${index + 1}',
                  style: TextStyle(
                    fontFamily: 'Comic Sans MS',
                    fontSize: 10,
                    color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final filteredLinks = _getFilteredLinks();
    
    return Dialog(
      insetPadding: const EdgeInsets.all(24),
      child: Container(
        width: MediaQuery.of(context).size.width * 0.8,
        height: MediaQuery.of(context).size.height * 0.8,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          color: Theme.of(context).colorScheme.background,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surface,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(16),
                  topRight: Radius.circular(16),
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    CupertinoIcons.link,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Select Hyperlinks',
                          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            fontFamily: 'Comic Sans MS',
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'From: ${widget.email['subject'] ?? 'No Subject'}',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            fontFamily: 'Comic Sans MS',
                            color: Theme.of(context).colorScheme.onSurface.withOpacity(0.7),
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  CupertinoButton(
                    padding: const EdgeInsets.all(8),
                    onPressed: () => Navigator.of(context).pop(),
                    child: Icon(
                      CupertinoIcons.xmark_circle_fill,
                      size: 28,
                      color: Colors.grey[400],
                    ),
                  ),
                ],
              ),
            ),
            
            // Search bar
            Padding(
              padding: const EdgeInsets.all(16),
              child: TextField(
                onChanged: (value) {
                  setState(() {
                    _searchQuery = value;
                  });
                },
                style: const TextStyle(fontFamily: 'Comic Sans MS'),
                decoration: InputDecoration(
                  hintText: 'Search links...',
                  hintStyle: const TextStyle(fontFamily: 'Comic Sans MS'),
                  prefixIcon: const Icon(CupertinoIcons.search),
                  suffixIcon: _searchQuery.isNotEmpty
                    ? CupertinoButton(
                        padding: EdgeInsets.zero,
                        onPressed: () {
                          setState(() {
                            _searchQuery = '';
                          });
                        },
                        child: const Icon(CupertinoIcons.clear_circled),
                      )
                    : null,
                ),
              ),
            ),
            
            // Selection summary
            if (_selectedLinks.isNotEmpty)
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 16),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.primaryContainer.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: Theme.of(context).colorScheme.primary.withOpacity(0.3),
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      CupertinoIcons.checkmark_circle,
                      color: Theme.of(context).colorScheme.primary,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '${_selectedLinks.length} link${_selectedLinks.length == 1 ? '' : 's'} selected',
                      style: TextStyle(
                        fontFamily: 'Comic Sans MS',
                        color: Theme.of(context).colorScheme.primary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const Spacer(),
                    CupertinoButton(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      onPressed: () {
                        setState(() {
                          _selectedLinks.clear();
                        });
                      },
                      child: Text(
                        'Clear All',
                        style: TextStyle(
                          fontFamily: 'Comic Sans MS',
                          color: Theme.of(context).colorScheme.primary,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            
            if (_selectedLinks.isNotEmpty)
              const SizedBox(height: 16),
            
            // Links count
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text(
                'Found ${filteredLinks.length} link${filteredLinks.length == 1 ? '' : 's'}',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  fontFamily: 'Comic Sans MS',
                  color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
                ),
              ),
            ),
            const SizedBox(height: 8),
            
            // Links list
            Expanded(
              child: filteredLinks.isEmpty
                ? Center(
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
                          _searchQuery.isEmpty 
                            ? 'No hyperlinks found in this email'
                            : 'No links match your search',
                          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                            fontFamily: 'Comic Sans MS',
                            color: Colors.grey[600],
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                      ],
                    ),
                  )
                : Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: ListView.builder(
                      itemCount: filteredLinks.length,
                      itemBuilder: (context, index) {
                        return _buildLinkItem(filteredLinks[index], index);
                      },
                    ),
                  ),
            ),
            
            // Action buttons
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                border: Border(
                  top: BorderSide(
                    color: Theme.of(context).colorScheme.outline.withOpacity(0.2),
                    width: 0.5,
                  ),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Select all / None buttons
                  Row(
                    children: [
                      CupertinoButton(
                        onPressed: filteredLinks.isEmpty
                          ? null
                          : () {
                              setState(() {
                                _selectedLinks.addAll(filteredLinks);
                              });
                            },
                        child: Text(
                          'Select All',
                          style: TextStyle(
                            fontFamily: 'Comic Sans MS',
                            color: filteredLinks.isEmpty
                              ? Colors.grey
                              : Theme.of(context).colorScheme.primary,
                          ),
                        ),
                      ),
                      CupertinoButton(
                        onPressed: _selectedLinks.isEmpty
                          ? null
                          : () {
                              setState(() {
                                _selectedLinks.clear();
                              });
                            },
                        child: Text(
                          'Select None',
                          style: TextStyle(
                            fontFamily: 'Comic Sans MS',
                            color: _selectedLinks.isEmpty
                              ? Colors.grey
                              : Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
                          ),
                        ),
                      ),
                    ],
                  ),
                  
                  // Main action buttons
                  Row(
                    children: [
                      CupertinoButton(
                        onPressed: () => Navigator.of(context).pop(),
                        child: Text(
                          'Cancel',
                          style: TextStyle(
                            fontFamily: 'Comic Sans MS',
                            color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      CupertinoButton.filled(
                        onPressed: _selectedLinks.isEmpty
                          ? null
                          : () {
                              // Close dialog and return selected links
                              Navigator.of(context).pop();
                              widget.onLinksSelected(_selectedLinks.toList());
                            },
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              CupertinoIcons.checkmark,
                              size: 16,
                              color: Colors.white,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'Confirm Selection (${_selectedLinks.length})',
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
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}