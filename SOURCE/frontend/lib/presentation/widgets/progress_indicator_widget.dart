import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:medium_flutter_extractor/data/models/progress_model.dart';
import 'package:medium_flutter_extractor/data/services/websocket_service.dart';
import 'package:medium_flutter_extractor/presentation/providers/websocket_provider.dart';

class ProgressIndicatorWidget extends ConsumerWidget {
  final String? batchId;
  final bool showDetails;
  final VoidCallback? onCancel;

  const ProgressIndicatorWidget({
    super.key,
    this.batchId,
    this.showDetails = true,
    this.onCancel,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final connectionStatus = ref.watch(connectionStatusProvider);
    final progressMap = ref.watch(scrapingProgressProvider);
    
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Scraping Progress',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _buildConnectionIndicator(connectionStatus),
                    if (onCancel != null && batchId != null) ...[
                      const SizedBox(width: 8),
                      IconButton(
                        icon: const Icon(Icons.cancel),
                        onPressed: onCancel,
                        tooltip: 'Cancel scraping',
                      ),
                    ],
                  ],
                ),
              ],
            ),
            const SizedBox(height: 16),
            
            // Progress content
            if (batchId != null) ...[
              _buildBatchProgress(context, progressMap[batchId]),
            ] else ...[
              _buildAllProgress(context, progressMap),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildConnectionIndicator(AsyncValue<ConnectionStatus> connectionStatus) {
    return connectionStatus.when(
      data: (status) {
        Color color;
        IconData icon;
        String tooltip;
        
        switch (status) {
          case ConnectionStatus.connected:
            color = Colors.green;
            icon = Icons.wifi;
            tooltip = 'Connected';
            break;
          case ConnectionStatus.connecting:
            color = Colors.orange;
            icon = Icons.wifi_find;
            tooltip = 'Connecting...';
            break;
          case ConnectionStatus.disconnected:
            color = Colors.grey;
            icon = Icons.wifi_off;
            tooltip = 'Disconnected';
            break;
          case ConnectionStatus.error:
            color = Colors.red;
            icon = Icons.error;
            tooltip = 'Connection Error';
            break;
        }
        
        return Tooltip(
          message: tooltip,
          child: Icon(icon, color: color, size: 20),
        );
      },
      loading: () => const SizedBox(
        width: 20,
        height: 20,
        child: CircularProgressIndicator(strokeWidth: 2),
      ),
      error: (_, __) => const Icon(Icons.error, color: Colors.red, size: 20),
    );
  }

  Widget _buildBatchProgress(BuildContext context, ProgressUpdate? progress) {
    if (progress == null) {
      return const Center(
        child: Text('No active scraping session'),
      );
    }

    final percentage = progress.total > 0 
        ? (progress.completed + progress.failed) / progress.total 
        : 0.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Progress bar
        LinearProgressIndicator(
          value: percentage,
          backgroundColor: Colors.grey[300],
          valueColor: AlwaysStoppedAnimation<Color>(
            progress.status == ProgressStatus.failed 
                ? Colors.red 
                : progress.status == ProgressStatus.completed
                    ? Colors.green
                    : Theme.of(context).primaryColor,
          ),
        ),
        const SizedBox(height: 8),
        
        // Stats row
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              '${progress.completed + progress.failed} / ${progress.total}',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            Text(
              '${(percentage * 100).toInt()}%',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        
        // Detailed stats
        if (showDetails) ...[
          Row(
            children: [
              _buildStatChip(
                'Completed',
                progress.completed.toString(),
                Colors.green,
                Icons.check_circle,
              ),
              const SizedBox(width: 8),
              _buildStatChip(
                'Failed',
                progress.failed.toString(),
                Colors.red,
                Icons.error,
              ),
              const SizedBox(width: 8),
              _buildStatChip(
                'Remaining',
                (progress.total - progress.completed - progress.failed).toString(),
                Colors.orange,
                Icons.schedule,
              ),
            ],
          ),
          const SizedBox(height: 12),
          
          // Current status
          if (progress.currentUrl != null && progress.status == ProgressStatus.running) ...[
            Text(
              'Currently scraping:',
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const SizedBox(height: 4),
            Text(
              progress.currentUrl!,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                fontStyle: FontStyle.italic,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 12),
          ],
          
          // Time info
          _buildTimeInfo(context, progress),
          
          // Results preview
          if (progress.results.isNotEmpty) ...[
            const SizedBox(height: 12),
            _buildResultsPreview(context, progress.results),
          ],
        ],
      ],
    );
  }

  Widget _buildAllProgress(BuildContext context, Map<String, ProgressUpdate> progressMap) {
    if (progressMap.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32),
          child: Column(
            children: [
              Icon(Icons.hourglass_empty, size: 48, color: Colors.grey),
              SizedBox(height: 16),
              Text('No active scraping sessions'),
            ],
          ),
        ),
      );
    }

    return Column(
      children: progressMap.entries.map((entry) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: ProgressIndicatorWidget(
            batchId: entry.key,
            showDetails: false,
          ),
        );
      }).toList(),
    );
  }

  Widget _buildStatChip(String label, String value, Color color, IconData icon) {
    return Chip(
      avatar: Icon(icon, size: 16, color: Colors.white),
      label: Text(
        '$label: $value',
        style: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: Colors.white,
        ),
      ),
      backgroundColor: color,
    );
  }

  Widget _buildTimeInfo(BuildContext context, ProgressUpdate progress) {
    final duration = progress.endTime != null
        ? progress.endTime!.difference(progress.startTime)
        : DateTime.now().difference(progress.startTime);
    
    final formattedDuration = _formatDuration(duration);
    
    return Row(
      children: [
        Icon(Icons.access_time, size: 16, color: Colors.grey[600]),
        const SizedBox(width: 4),
        Text(
          progress.status == ProgressStatus.completed
              ? 'Completed in $formattedDuration'
              : 'Running for $formattedDuration',
          style: Theme.of(context).textTheme.bodySmall,
        ),
      ],
    );
  }

  Widget _buildResultsPreview(BuildContext context, List<ScrapingResult> results) {
    final recentResults = results.take(3).toList();
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Recent Results:',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 4),
        ...recentResults.map((result) => Padding(
          padding: const EdgeInsets.only(left: 16, bottom: 2),
          child: Row(
            children: [
              Icon(
                result.status == ScrapingStatus.completed
                    ? Icons.check_circle
                    : result.status == ScrapingStatus.failed
                        ? Icons.error
                        : Icons.hourglass_empty,
                size: 12,
                color: result.status == ScrapingStatus.completed
                    ? Colors.green
                    : result.status == ScrapingStatus.failed
                        ? Colors.red
                        : Colors.orange,
              ),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  result.title.isNotEmpty ? result.title : result.url,
                  style: Theme.of(context).textTheme.bodySmall,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        )).toList(),
        if (results.length > 3) ...[
          Padding(
            padding: const EdgeInsets.only(left: 16),
            child: Text(
              '... and ${results.length - 3} more',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                fontStyle: FontStyle.italic,
              ),
            ),
          ),
        ],
      ],
    );
  }

  String _formatDuration(Duration duration) {
    if (duration.inHours > 0) {
      return '${duration.inHours}h ${duration.inMinutes.remainder(60)}m';
    } else if (duration.inMinutes > 0) {
      return '${duration.inMinutes}m ${duration.inSeconds.remainder(60)}s';
    } else {
      return '${duration.inSeconds}s';
    }
  }
}