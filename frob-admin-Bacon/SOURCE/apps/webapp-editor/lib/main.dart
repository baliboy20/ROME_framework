import 'package:flutter/material.dart';

import 'app.dart';
import 'core/service_locator.dart';

void main() {
  setupServiceLocator();
  runApp(const EditorApp());
}
