import 'package:equatable/equatable.dart';

/// A6 / SEO03 — publish page + content-quality snapshot.
class ContentSnapshot extends Equatable {
  final List<ContentPage> pages;
  final List<QualityItem> quality;
  const ContentSnapshot({required this.pages, required this.quality});

  @override
  List<Object?> get props => [pages, quality];
}

class ContentPage extends Equatable {
  final String tourId;
  final String path;
  final String title;
  final bool published;
  const ContentPage({required this.tourId, required this.path, required this.title, required this.published});

  @override
  List<Object?> get props => [tourId, path, title, published];
}

class QualityItem extends Equatable {
  final String title;
  final String detail;
  const QualityItem({required this.title, required this.detail});

  @override
  List<Object?> get props => [title, detail];
}
