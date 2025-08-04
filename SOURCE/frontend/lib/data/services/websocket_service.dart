import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:medium_flutter_extractor/core/config/environment.dart';
import 'package:medium_flutter_extractor/data/models/progress_model.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;

class WebSocketService {
  IO.Socket? _socket;
  final StreamController<ProgressUpdate> _progressController = StreamController<ProgressUpdate>.broadcast();
  final StreamController<ConnectionStatus> _connectionController = StreamController<ConnectionStatus>.broadcast();
  
  Stream<ProgressUpdate> get progressStream => _progressController.stream;
  Stream<ConnectionStatus> get connectionStream => _connectionController.stream;
  
  bool get isConnected => _socket?.connected ?? false;
  
  Future<void> connect() async {
    try {
      _socket = IO.io(
        Environment.websocketUrl,
        IO.OptionBuilder()
            .setTransports(['websocket'])
            .enableAutoConnect()
            .enableReconnection()
            .setReconnectionAttempts(5)
            .setReconnectionDelay(1000)
            .setTimeout(10000)
            .build(),
      );
      
      _socket!.onConnect((_) {
        _connectionController.add(ConnectionStatus.connected);
      });
      
      _socket!.onDisconnect((_) {
        _connectionController.add(ConnectionStatus.disconnected);
      });
      
      _socket!.onConnectError((error) {
        _connectionController.add(ConnectionStatus.error);
      });
      
      // Listen for progress updates
      _socket!.on('scraping:progress', (data) {
        try {
          final progress = ProgressUpdate.fromJson(data);
          _progressController.add(progress);
        } catch (e) {
          // Handle parsing error
        }
      });
      
      // Listen for batch completion
      _socket!.on('scraping:completed', (data) {
        try {
          final progress = ProgressUpdate.fromJson(data);
          _progressController.add(progress);
        } catch (e) {
          // Handle parsing error
        }
      });
      
      // Listen for scraping errors
      _socket!.on('scraping:error', (data) {
        try {
          final progress = ProgressUpdate.fromJson(data);
          _progressController.add(progress);
        } catch (e) {
          // Handle parsing error
        }
      });
      
      _socket!.connect();
    } catch (e) {
      _connectionController.add(ConnectionStatus.error);
    }
  }
  
  void listenToProgress(String batchId, Function(ProgressUpdate) onProgress) {
    _socket?.emit('subscribe', {'batchId': batchId});
    
    final subscription = progressStream.listen((progress) {
      if (progress.batchId == batchId) {
        onProgress(progress);
      }
    });
    
    // Auto-unsubscribe when batch is complete
    subscription.onData((progress) {
      if (progress.batchId == batchId && progress.status == ProgressStatus.completed) {
        subscription.cancel();
        _socket?.emit('unsubscribe', {'batchId': batchId});
      }
    });
  }
  
  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
  }
  
  void dispose() {
    disconnect();
    _progressController.close();
    _connectionController.close();
  }
}

enum ConnectionStatus {
  connecting,
  connected,
  disconnected,
  error,
}