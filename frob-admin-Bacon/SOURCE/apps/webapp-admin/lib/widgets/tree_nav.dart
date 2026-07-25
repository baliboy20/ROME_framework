import 'package:flutter/material.dart';
import '../theme/tokens.dart';

class NavLeaf {
  final String code;
  final String label;
  final String route;
  const NavLeaf(this.code, this.label, this.route);
}

class NavGroup {
  final String title;
  final List<NavLeaf> leaves;
  const NavGroup(this.title, this.leaves);
}

/// TreeNav — collapsible grouped tree nav; collapses to a 68px icon rail.
/// Collapse/expand state is a client-only transient (UXD-18).
class TreeNav extends StatefulWidget {
  final List<NavGroup> groups;
  final String activeRoute;
  final void Function(String route) onSelect;

  const TreeNav({super.key, required this.groups, required this.activeRoute, required this.onSelect});

  @override
  State<TreeNav> createState() => _TreeNavState();
}

class _TreeNavState extends State<TreeNav> {
  bool collapsed = false;
  final Set<String> openGroups = {};

  @override
  void initState() {
    super.initState();
    openGroups.addAll(widget.groups.map((g) => g.title));
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 160),
      width: collapsed ? 68 : 240,
      color: FobColors.surfaceRail,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 20, 12, 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (!collapsed)
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Friends on Bikes',
                            style: TextStyle(
                                fontFamily: FobText.serif,
                                fontSize: 18,
                                height: 1.1,
                                fontWeight: FontWeight.w600,
                                color: FobColors.textStrong)),
                        const SizedBox(height: 2),
                        Text('BACK OFFICE', style: FobText.microLabel),
                      ],
                    ),
                  ),
                _RailToggle(
                  collapsed: collapsed,
                  onTap: () => setState(() => collapsed = !collapsed),
                ),
              ],
            ),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              children: widget.groups.map((g) => _buildGroup(g)).toList(),
            ),
          ),
          if (!collapsed)
            Container(
              margin: const EdgeInsets.fromLTRB(16, 8, 16, 18),
              padding: const EdgeInsets.only(top: 16),
              decoration: const BoxDecoration(
                border: Border(top: BorderSide(color: Color(0xFFE6E1D2))),
              ),
              child: Row(
                children: [
                  Container(
                    width: 34,
                    height: 34,
                    alignment: Alignment.center,
                    decoration: const BoxDecoration(
                        gradient: FobColors.gradientBrand, shape: BoxShape.circle),
                    child: const Text('W',
                        style: TextStyle(
                            fontFamily: FobText.serif,
                            fontWeight: FontWeight.w700,
                            color: Colors.white)),
                  ),
                  const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Text('William',
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: FobColors.textStrong)),
                      Text('Owner', style: TextStyle(fontSize: 11, color: FobColors.textMuted)),
                    ],
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildGroup(NavGroup g) {
    final open = openGroups.contains(g.title);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (!collapsed)
          InkWell(
            onTap: () => setState(() => open ? openGroups.remove(g.title) : openGroups.add(g.title)),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              child: Row(
                children: [
                  Icon(open ? Icons.expand_more : Icons.chevron_right, size: 14, color: FobColors.textMuted),
                  const SizedBox(width: 4),
                  Text(g.title.toUpperCase(), style: FobText.microLabel),
                ],
              ),
            ),
          ),
        if (collapsed || open)
          ...g.leaves.map((leaf) {
            final active = widget.activeRoute == leaf.route;
            return Tooltip(
              message: leaf.label,
              child: InkWell(
                borderRadius: BorderRadius.circular(10),
                onTap: () => widget.onSelect(leaf.route),
                child: Container(
                  margin: const EdgeInsets.only(bottom: 2, left: 4, right: 4),
                  decoration: BoxDecoration(
                    color: active ? FobColors.surfaceBgLo : null,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  padding: EdgeInsets.symmetric(horizontal: collapsed ? 0 : 12, vertical: 8),
                  child: collapsed
                      ? Center(
                          child: Text(leaf.code,
                              style: TextStyle(
                                  fontFamily: FobText.mono,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  color: active ? FobColors.pink : FobColors.textMuted)))
                      : Row(
                          children: [
                            Text(leaf.code,
                                style: TextStyle(
                                    fontFamily: FobText.mono,
                                    fontSize: 10,
                                    color: active ? FobColors.pink : FobColors.textFaint)),
                            const SizedBox(width: 8),
                            Text(leaf.label,
                                style: TextStyle(
                                    fontSize: 12.5,
                                    fontWeight: active ? FontWeight.w700 : FontWeight.w500,
                                    color: active ? FobColors.textStrong : FobColors.textBody)),
                          ],
                        ),
                ),
              ),
            );
          }),
      ],
    );
  }
}

/// Small square rail collapse/expand toggle (.rail-toggle).
class _RailToggle extends StatelessWidget {
  final bool collapsed;
  final VoidCallback onTap;
  const _RailToggle({required this.collapsed, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      key: const Key('nav-collapse-toggle'),
      borderRadius: BorderRadius.circular(8),
      onTap: onTap,
      child: Container(
        width: 26,
        height: 26,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: const Color(0xFFEFE9D9),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: const Color(0xFFE3DDC9)),
        ),
        child: Icon(collapsed ? Icons.chevron_right : Icons.chevron_left,
            size: 16, color: FobColors.textMuted),
      ),
    );
  }
}
