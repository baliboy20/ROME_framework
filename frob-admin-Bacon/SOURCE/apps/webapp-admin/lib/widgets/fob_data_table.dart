import 'package:flutter/material.dart';
import '../theme/tokens.dart';

class FobColumn<T> {
  final String label;
  final int flex;
  final Widget Function(T row) render;
  final TextAlign align;
  const FobColumn({required this.label, required this.render, this.flex = 1, this.align = TextAlign.left});
}

/// DataTable — CSS-grid-like rows, uppercase mono header, custom cell render.
class FobDataTable<T> extends StatelessWidget {
  final List<FobColumn<T>> columns;
  final List<T> rows;
  final void Function(T row)? onRowTap;
  final String emptyText;
  final bool loading;

  const FobDataTable({
    super.key,
    required this.columns,
    required this.rows,
    this.onRowTap,
    this.emptyText = 'No records to show.',
    this.loading = false,
  });

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Padding(
        padding: EdgeInsets.all(FobSpace.block),
        child: Center(child: CircularProgressIndicator()),
      );
    }
    if (rows.isEmpty) {
      return Padding(
        padding: const EdgeInsets.all(FobSpace.block),
        child: Text(emptyText, style: FobText.body),
      );
    }
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: const BoxDecoration(
            border: Border(bottom: BorderSide(color: FobColors.hairline)),
          ),
          child: Row(
            children: columns
                .map((c) => Expanded(
                      flex: c.flex,
                      child: Text(c.label.toUpperCase(), style: FobText.microLabel, textAlign: c.align),
                    ))
                .toList(),
          ),
        ),
        ...rows.map((r) => InkWell(
              onTap: onRowTap == null ? null : () => onRowTap!(r),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: const BoxDecoration(
                  border: Border(bottom: BorderSide(color: FobColors.hairline)),
                ),
                child: Row(
                  children: columns
                      .map((c) => Expanded(
                            flex: c.flex,
                            child: Align(
                              alignment: c.align == TextAlign.right
                                  ? Alignment.centerRight
                                  : Alignment.centerLeft,
                              child: c.render(r),
                            ),
                          ))
                      .toList(),
                ),
              ),
            )),
      ],
    );
  }
}
