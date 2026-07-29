import '../../../../core/network/api_result.dart';

abstract class AuthRemoteDataSource {
  /// Returns `{ token, name }`. THROWS on failure.
  Future<Map<String, dynamic>> ownerLogin(String email, String password);
  Future<void> logout();
}

class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  final ApiHttp http;
  AuthRemoteDataSourceImpl(this.http);

  @override
  Future<Map<String, dynamic>> ownerLogin(String email, String password) async {
    final data = await http.post('/auth/owner/login', body: {'email': email, 'password': password});
    return (data as Map).cast<String, dynamic>();
  }

  @override
  Future<void> logout() async {
    await http.post('/auth/logout');
  }
}
