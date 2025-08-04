import 'package:freezed_annotation/freezed_annotation.dart';

part 'email_filter_model.freezed.dart';
part 'email_filter_model.g.dart';

@freezed
class EmailFilterModel with _$EmailFilterModel {
  const factory EmailFilterModel({
    required DateTime startDate,
    required DateTime endDate,
    @Default(['Medium Daily Digest']) List<String> subjects,
    @Default(['flutter']) List<String> keywords,
  }) = _EmailFilterModel;

  factory EmailFilterModel.fromJson(Map<String, dynamic> json) =>
      _$EmailFilterModelFromJson(json);
}