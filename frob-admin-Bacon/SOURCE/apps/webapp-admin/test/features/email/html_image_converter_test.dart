import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:image/image.dart' as img;
import 'package:fob_webapp_admin/features/email/domain/usecases/html_image_converter.dart';

String uri(String mime, List<int> bytes) => 'data:image/$mime;base64,${base64Encode(bytes)}';

/// Opaque red square.
List<int> webpOpaque() {
  final im = img.Image(width: 8, height: 8);
  img.fill(im, color: img.ColorRgb8(200, 30, 30));
  return img.encodeWebP(im);
}

/// Same square with a transparent hole punched in it.
List<int> webpTransparent() {
  final im = img.Image(width: 8, height: 8, numChannels: 4);
  img.fill(im, color: img.ColorRgba8(200, 30, 30, 255));
  im.setPixelRgba(0, 0, 0, 0, 0, 0);
  return img.encodeWebP(im);
}

void main() {
  group('format rule', () {
    test('an opaque image becomes JPEG — smaller, and transparency is not needed', () {
      final html = '<img src="${uri("webp", webpOpaque())}">';
      final r = convertEmbeddedImages(html);

      expect(r.converted, hasLength(1));
      expect(r.converted.single.toMime, 'jpeg');
      expect(r.converted.single.hadTransparency, isFalse);
      expect(r.html, contains('data:image/jpeg;base64,'));
      expect(r.html, isNot(contains('image/webp')));
    });

    // The one that matters. JPEG cannot store transparency, so converting a
    // logo with a clear background to JPEG puts a solid box behind it.
    test('a transparent image becomes PNG, never JPEG', () {
      final html = '<img src="${uri("webp", webpTransparent())}">';
      final r = convertEmbeddedImages(html);

      expect(r.converted.single.hadTransparency, isTrue);
      expect(r.converted.single.toMime, 'png');
      expect(r.html, contains('data:image/png;base64,'));
    });
  });

  group('what it leaves alone', () {
    test('JPEG and PNG pass through untouched — re-encoding would only lose quality', () {
      final jpeg = img.encodeJpg(img.Image(width: 4, height: 4));
      final html = '<img src="${uri("jpeg", jpeg)}">';
      final r = convertEmbeddedImages(html);

      expect(r.converted, isEmpty);
      expect(r.untouched, 1);
      expect(r.html, html);
    });

    test('an undecodable image is left as it was rather than failing the import', () {
      const html = '<img src="data:image/webp;base64,AAAAA">';
      final r = convertEmbeddedImages(html);

      expect(r.converted, isEmpty);
      expect(r.untouched, 1);
      expect(r.html, html); // document survives intact
    });

    test('a document with no images is returned unchanged', () {
      const html = '<p>Hi {{name}}</p>';
      expect(convertEmbeddedImages(html).html, html);
    });
  });

  // The bulletproof-background pattern: one picture referenced three times so
  // three different mail clients can each find it. All three references must
  // end up pointing at the converted image — miss one and that client's
  // background breaks.
  test('one image referenced three times is converted once and all three follow', () {
    final u = uri('webp', webpOpaque());
    final html = '<td background="$u" style="background-image:url(\'$u\')">'
        '<v:fill src="$u" /></td>';
    final r = convertEmbeddedImages(html);

    expect(r.converted, hasLength(1)); // decoded once
    expect(r.html.contains('image/webp'), isFalse); // no reference left behind
    final count = RegExp('data:image/jpeg;base64,').allMatches(r.html).length;
    expect(count, 3); // every reference rewritten
  });

  test('reports enough detail to tell the Owner what changed', () {
    final r = convertEmbeddedImages('<img src="${uri("webp", webpOpaque())}">');
    final c = r.converted.single;
    expect(c.fromMime, 'webp');
    expect(c.fromBytes, greaterThan(0));
    expect(c.toBytes, greaterThan(0));
    expect(r.didAnything, isTrue);
  });
}
