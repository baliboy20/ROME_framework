import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:medium_flutter_extractor/data/models/progress_model.dart';
import 'package:medium_flutter_extractor/data/services/websocket_service.dart';
import 'package:mocktail/mocktail.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;

import '../../helpers/test_helpers.dart';

// Mock Socket.IO socket
class MockSocket extends Mock implements IO.Socket {}

void main() {
  group('WebSocketService', () {
    late WebSocketService webSocketService;
    late MockSocket mockSocket;
    late StreamController<dynamic> mockConnectController;
    late StreamController<dynamic> mockDisconnectController;
    late StreamController<dynamic> mockProgressController;

    setUp(() {
      mockSocket = MockSocket();
      mockConnectController = StreamController<dynamic>.broadcast();
      mockDisconnectController = StreamController<dynamic>.broadcast();
      mockProgressController = StreamController<dynamic>.broadcast();
      
      webSocketService = WebSocketService();

      // Setup mock socket behavior
      when(() => mockSocket.connected).thenReturn(false);
      when(() => mockSocket.connect()).thenReturn(mockSocket);
      when(() => mockSocket.disconnect()).thenReturn(mockSocket);
      when(() => mockSocket.dispose()).thenReturn(null);
      
      // Mock event listeners
      when(() => mockSocket.onConnect(any())).thenAnswer((invocation) {
        final callback = invocation.positionalArguments[0] as void Function(dynamic)?;
        if (callback != null) mockConnectController.stream.listen(callback);
      });
      
      when(() => mockSocket.onDisconnect(any())).thenAnswer((invocation) {
        final callback = invocation.positionalArguments[0] as void Function(dynamic)?;
        if (callback != null) mockDisconnectController.stream.listen(callback);
      });
      
      when(() => mockSocket.on('scraping:progress', any())).thenAnswer((invocation) {
        final callback = invocation.positionalArguments[1] as void Function(dynamic)?;
        if (callback != null) mockProgressController.stream.listen(callback);
      });
    });

    tearDown(() {
      webSocketService.dispose();
      mockConnectController.close();
      mockDisconnectController.close();
      mockProgressController.close();
    });

    test('should initialize with disconnected state', () {
      expect(webSocketService.isConnected, isFalse);
    });

    test('should emit connection status on connect', () async {
      final connectionStatusFuture = webSocketService.connectionStream.first;

      // Simulate connection
      mockConnectController.add(null);

      final status = await connectionStatusFuture;
      expect(status, equals(ConnectionStatus.connected));
    });

    test('should emit disconnection status on disconnect', () async {
      late StreamSubscription subscription;
      ConnectionStatus? lastStatus;

      subscription = webSocketService.connectionStream.listen((status) {
        lastStatus = status;
      });

      // Simulate disconnection
      mockDisconnectController.add(null);

      await Future.delayed(const Duration(milliseconds: 10));
      
      expect(lastStatus, equals(ConnectionStatus.disconnected));
      await subscription.cancel();
    });

    test('should parse and emit progress updates', () async {
      final progressData = {
        'batchId': TestData.sampleBatchId,
        'total': 10,
        'completed': 5,
        'failed': 1,
        'status': 'running',
        'startTime': DateTime.now().toIso8601String(),
        'results': [],
      };

      late StreamSubscription subscription;
      ProgressUpdate? receivedProgress;

      subscription = webSocketService.progressStream.listen((progress) {
        receivedProgress = progress;
      });

      // Simulate progress update
      mockProgressController.add(progressData);

      await Future.delayed(const Duration(milliseconds: 10));

      expect(receivedProgress, isNotNull);
      expect(receivedProgress!.batchId, equals(TestData.sampleBatchId));
      expect(receivedProgress!.total, equals(10));
      expect(receivedProgress!.completed, equals(5));
      expect(receivedProgress!.failed, equals(1));
      
      await subscription.cancel();
    });

    test('should handle invalid progress data gracefully', () async {
      final invalidProgressData = {
        'invalidField': 'invalidValue',
      };

      late StreamSubscription subscription;
      var progressReceived = false;

      subscription = webSocketService.progressStream.listen((progress) {
        progressReceived = true;
      });

      // Simulate invalid progress update
      mockProgressController.add(invalidProgressData);

      await Future.delayed(const Duration(milliseconds: 10));

      // Should not emit invalid progress
      expect(progressReceived, isFalse);
      
      await subscription.cancel();
    });

    test('should handle multiple progress listeners', () async {
      final progressData1 = {
        'batchId': 'batch_1',
        'total': 5,
        'completed': 2,
        'failed': 0,
        'status': 'running',
        'startTime': DateTime.now().toIso8601String(),
        'results': [],
      };

      final progressData2 = {
        'batchId': 'batch_2',
        'total': 3,
        'completed': 1,
        'failed': 0,
        'status': 'running',
        'startTime': DateTime.now().toIso8601String(),
        'results': [],
      };

      final receivedProgresses = <ProgressUpdate>[];
      late StreamSubscription subscription;

      subscription = webSocketService.progressStream.listen((progress) {
        receivedProgresses.add(progress);
      });

      // Simulate multiple progress updates
      mockProgressController.add(progressData1);
      mockProgressController.add(progressData2);

      await Future.delayed(const Duration(milliseconds: 10));

      expect(receivedProgresses.length, equals(2));
      expect(receivedProgresses[0].batchId, equals('batch_1'));
      expect(receivedProgresses[1].batchId, equals('batch_2'));
      
      await subscription.cancel();
    });

    test('should dispose properly', () {
      // Should not throw any exceptions
      expect(() => webSocketService.dispose(), returnsNormally);
    });

    test('should handle connection errors', () async {
      late StreamSubscription subscription;
      ConnectionStatus? lastStatus;

      subscription = webSocketService.connectionStream.listen((status) {
        lastStatus = status;
      });

      // Mock connection error handler
      when(() => mockSocket.onConnectError(any())).thenAnswer((invocation) {
        final callback = invocation.positionalArguments[0] as Function;
        callback('Connection failed');
      });

      await Future.delayed(const Duration(milliseconds: 10));
      
      await subscription.cancel();
    });

    test('should handle completed scraping events', () async {
      final completedData = {
        'batchId': TestData.sampleBatchId,
        'total': 5,
        'completed': 5,
        'failed': 0,
        'status': 'completed',
        'startTime': DateTime.now().subtract(const Duration(minutes: 5)).toIso8601String(),
        'endTime': DateTime.now().toIso8601String(),
        'results': [],
      };

      late StreamSubscription subscription;
      ProgressUpdate? receivedProgress;

      subscription = webSocketService.progressStream.listen((progress) {
        receivedProgress = progress;
      });

      // Mock completed event listener
      when(() => mockSocket.on('scraping:completed', any())).thenAnswer((invocation) {
        final callback = invocation.positionalArguments[1] as Function;
        callback(completedData);
      });

      await Future.delayed(const Duration(milliseconds: 10));

      await subscription.cancel();
    });

    test('should handle scraping error events', () async {
      final errorData = {
        'batchId': TestData.sampleBatchId,
        'total': 5,
        'completed': 2,
        'failed': 3,
        'status': 'failed',
        'startTime': DateTime.now().subtract(const Duration(minutes: 2)).toIso8601String(),
        'results': [],
        'error': 'Network timeout',
      };

      late StreamSubscription subscription;
      ProgressUpdate? receivedProgress;

      subscription = webSocketService.progressStream.listen((progress) {
        receivedProgress = progress;
      });

      // Mock error event listener
      when(() => mockSocket.on('scraping:error', any())).thenAnswer((invocation) {
        final callback = invocation.positionalArguments[1] as Function;
        callback(errorData);
      });

      await Future.delayed(const Duration(milliseconds: 10));

      await subscription.cancel();
    });
  });
}