// FR-001 workstream 5 — convert embedded images in an imported HTML document
// to formats every mail client can display.
//
// WHY THIS RUNS IN THE APP, NOT THE WORKER
// The Workers runtime has no image codec. Converting there would mean a large
// WebAssembly bundle in the request path, or Cloudflare's paid image service.
// The Mac app already has a full image stack, the work is one-off at import,
// and it happens on the Owner's own machine — so the document that reaches the
// worker is already correct rather than being fixed up downstream.
//
// THE FORMAT RULE
// - Transparent → PNG. JPEG cannot store transparency; converting a logo with
//   a clear background to JPEG fills it with solid colour, which shows up as a
//   white or black box behind the logo.
// - Everything else → JPEG, which is far smaller for photographs.
//
// WebP is the format that makes this necessary: classic Outlook desktop
// renders through the Word engine and cannot decode it, so a WebP logo is a
// broken image and a WebP background silently falls back to a flat colour.

import 'dart:convert';
import 'dart:typed_data';

import 'package:image/image.dart' as img;

/// One converted image, with enough detail to explain what happened.
class ConvertedImage {
  final String fromMime;
  final String toMime;
  final int fromBytes;
  final int toBytes;
  final bool hadTransparency;

  const ConvertedImage({
    required this.fromMime,
    required this.toMime,
    required this.fromBytes,
    required this.toBytes,
    required this.hadTransparency,
  });
}

class ImageConversionResult {
  final String html;
  final List<ConvertedImage> converted;

  /// Images left exactly as they were — already a safe format, or undecodable.
  final int untouched;

  const ImageConversionResult({
    required this.html,
    required this.converted,
    required this.untouched,
  });

  bool get didAnything => converted.isNotEmpty;
}

final _dataUri = RegExp(r'data:image/([a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)');

/// Formats every major mail client renders. These are passed through untouched
/// — re-encoding them would lose quality for no benefit.
const _safeFormats = {'jpeg', 'jpg', 'png', 'gif'};

bool _hasTransparency(img.Image image) {
  if (!image.hasAlpha) return false;
  // Alpha channel present is not the same as alpha USED — plenty of images
  // carry an unused one. Check actual pixels, so a fully opaque image with an
  // alpha channel still gets the smaller JPEG.
  for (final p in image) {
    if (p.a < 255) return true;
  }
  return false;
}

/// Rewrites every embedded image in [html] that a mail client may not display.
///
/// Deliberately never throws: an image that cannot be decoded is left exactly
/// as it was and counted in [ImageConversionResult.untouched]. One awkward
/// image must not cost the Owner the document they just pasted.
ImageConversionResult convertEmbeddedImages(String html) {
  final converted = <ConvertedImage>[];
  var untouched = 0;
  var output = html;

  // Distinct payloads only. One image is routinely embedded several times (the
  // "bulletproof background" pattern references the same picture from an
  // attribute, a style and an Outlook VML fill), so decode once and replace
  // every occurrence — all those references must keep working.
  final seen = <String, String>{};

  for (final m in _dataUri.allMatches(html)) {
    final whole = m.group(0)!;
    final mime = m.group(1)!.toLowerCase();
    final b64 = m.group(2)!;

    if (seen.containsKey(b64)) continue;

    if (_safeFormats.contains(mime)) {
      untouched++;
      seen[b64] = whole;
      continue;
    }

    Uint8List bytes;
    try {
      bytes = base64Decode(b64);
    } catch (_) {
      untouched++;
      seen[b64] = whole;
      continue;
    }

    final decoded = img.decodeImage(bytes);
    if (decoded == null) {
      untouched++;
      seen[b64] = whole;
      continue;
    }

    final transparent = _hasTransparency(decoded);
    final Uint8List encoded;
    final String toMime;
    if (transparent) {
      encoded = img.encodePng(decoded);
      toMime = 'png';
    } else {
      // 82 keeps photographs visually clean at a fraction of PNG's size.
      encoded = img.encodeJpg(decoded, quality: 82);
      toMime = 'jpeg';
    }

    final replacement = 'data:image/$toMime;base64,${base64Encode(encoded)}';
    output = output.replaceAll(whole, replacement);
    seen[b64] = replacement;

    converted.add(ConvertedImage(
      fromMime: mime,
      toMime: toMime,
      fromBytes: bytes.length,
      toBytes: encoded.length,
      hadTransparency: transparent,
    ));
  }

  return ImageConversionResult(html: output, converted: converted, untouched: untouched);
}

/// How many distinct embedded images a document contains, without decoding any
/// of them. Used to tell the Owner what is about to happen ("Converting 2
/// images…") before the slow work starts — a bare spinner with no number gives
/// no sense of whether to wait or give up.
int countEmbeddedImages(String html) {
  final seen = <String>{};
  for (final m in _dataUri.allMatches(html)) {
    seen.add(m.group(2)!);
  }
  return seen.length;
}
