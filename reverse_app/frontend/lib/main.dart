import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'data/datasources/api_client.dart';
import 'data/repositories/text_repository_impl.dart';
import 'presentation/blocs/text_bloc/text_bloc.dart';
import 'presentation/pages/home_page.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Reverse Text App',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
      ),
      home: BlocProvider(
        create: (context) => TextBloc(
          textRepository: TextRepositoryImpl(
            apiClient: ApiClient(
              baseUrl: 'http://localhost:3000',
            ),
          ),
        ),
        child: const HomePage(),
      ),
    );
  }
}

