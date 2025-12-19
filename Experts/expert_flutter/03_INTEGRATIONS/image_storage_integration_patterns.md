# Image Storage & CDN Integration Patterns
## The Art Deco Bakery - Flutter Application

---

## 1. Architecture Overview

**Image Storage**: Cloudinary CDN
**Frontend**: `image_picker` package (5MB max, 1920x1920 max)
**Backend**: Parse Server Cloud Functions
**Metadata**: Stored in Parse Product object

---

## 2. Upload Flow

### Frontend (Flutter)

```dart
// 📁 lib/features/admin/product_management/presentation/widgets/image_upload_button.dart

final bytes = await ImagePicker().pickImage(source: ImageSource.gallery);
final base64Image = 'data:image/jpg;base64,${base64Encode(bytes)}';

// Send to backend
await ParseCloud.callFunction('uploadProductImage', {
  'productId': productId,
  'imageData': base64Image,
  'filename': 'product-image.jpg',
  'isPrimary': false,
});
```

### Backend (Parse Cloud Function)

```javascript
// /parse-server/cloud/functions/productImages.js

Parse.Cloud.define('uploadProductImage', async (req) => {
  // 1. Verify admin access
  await verifyAdminAccess(req.user);

  // 2. Upload to Cloudinary
  const result = await cloudinary.uploader.upload(req.params.imageData, {
    folder: `bakery/products/${req.params.productId}`,
    public_id: `${Date.now()}`,
    overwrite: false,
    transformation: [{ width: 1920, height: 1920, crop: 'limit' }],
  });

  // 3. Store metadata in Product
  const product = await getProduct(req.params.productId);
  product.add('images', {
    id: `img_${Date.now()}`,
    url: result.secure_url,
    cloudinaryPublicId: result.public_id,
    filename: req.params.filename,
    size: result.bytes,
    isPrimary: req.params.isPrimary,
    uploadedAt: new Date(),
    uploadedBy: req.user.id,
  });

  return { url: result.secure_url, id: result.public_id };
});
```

---

## 3. Retrieval

**Customer Views** (Single Image):
```dart
// Uses imageUrl string field
ProductModel.fromJson({
  'imageUrl': 'https://res.cloudinary.com/.../image.jpg',
});
```

**Admin Views** (All Images):
```dart
// Uses full images array with metadata
AdminProduct images: [
  ProductImage(
    id: 'img_123',
    url: 'https://res.cloudinary.com/.../image.jpg',
    isPrimary: true,
    uploadedAt: DateTime.now(),
  ),
]
```

---

## 4. Transformations (CloudinaryHelper)

```dart
// 📁 lib/core/utils/cloudinary_helper.dart

// Responsive image URLs with auto-optimization
CloudinaryPresets.thumbnail()   // 200x200 (grid views)
CloudinaryPresets.card()        // 400x300 (product cards)
CloudinaryPresets.medium()      // 800x800 (detail views)
CloudinaryPresets.hero()        // 1600x600 (banners)
CloudinaryPresets.large()       // 1920x1920 (full screen)

// Auto applies: q_auto (quality), f_auto (WebP), responsive sizing
```

Example:
```dart
final thumbnailUrl = cloudinaryHelper.getTransformedUrl(
  imageUrl,
  CloudinaryPresets.card(),
);
// Result: https://res.cloudinary.com/.../w_400,h_300,q_auto,f_auto/image.jpg
```

---

## 5. Management Operations

```dart
// Backend Cloud Functions
uploadProductImage()    // Upload + store in Product
deleteProductImage()    // Remove + delete from Cloudinary
replaceProductImage()   // Swap with existing
reorderProductImages()  // Reorder, first becomes primary
```

---

## 6. Data Model

```dart
// 📁 lib/features/product_catalog/domain/entities/product_image.dart

class ProductImage extends Equatable {
  final String id;
  final String url;              // https://res.cloudinary.com/.../...
  final String cloudinaryPublicId;
  final String filename;
  final int size;
  final int order;
  final bool isPrimary;
  final DateTime uploadedAt;
  final String uploadedBy;

  const ProductImage({/* ... */});
}
```

---

## 7. Validation Rules

- **File Size**: Max 5MB
- **Dimensions**: Max 1920x1920
- **Formats**: jpg, jpeg, png, webp
- **Per Product**: Max 10 images
- **Access**: Admin-only via `verifyAdminAccess()`

---

## 8. Security

✅ Admin-only upload/delete via Cloud Functions
✅ Base64 transmitted over HTTPS
✅ Cloudinary secure URLs with transformation tokens
✅ Audit logging (uploadedBy, uploadedAt)
✅ Soft deletes from Cloudinary with fallback handling

---

## 9. Integration Checklist

- [ ] Cloudinary account configured with API credentials
- [ ] Cloud Functions deployed: uploadProductImage, deleteProductImage, etc.
- [ ] ProductImage model & serialization implemented
- [ ] CloudinaryHelper utility configured with presets
- [ ] Admin UI for image management implemented
- [ ] Validation rules enforced (size, format, dimensions)
- [ ] Cache strategy for transformed URLs
- [ ] Error handling for upload/delete failures
- [ ] Audit logging enabled

---

## Best Practices

✅ Use CloudinaryPresets for responsive images
✅ Validate on both frontend and backend
✅ Store metadata in Product object
✅ Use Cloud Functions for admin operations
✅ Log all image operations for audit trail
❌ Don't store images in Parse directly
❌ Don't hardcode Cloudinary URLs
❌ Don't bypass admin verification
