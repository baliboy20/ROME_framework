/* @ds-bundle: {"format":4,"namespace":"FOBBookingAdmin_27b13c","components":[{"name":"Button","sourcePath":"components/Components/Button/Button.jsx"},{"name":"Card","sourcePath":"components/Components/Card/Card.jsx"},{"name":"DataTable","sourcePath":"components/Components/DataTable/DataTable.jsx"},{"name":"Field","sourcePath":"components/Components/Field/Field.jsx"},{"name":"FilterChip","sourcePath":"components/Components/FilterChip/FilterChip.jsx"},{"name":"Modal","sourcePath":"components/Components/Modal/Modal.jsx"},{"name":"StatusPill","sourcePath":"components/Components/StatusPill/StatusPill.jsx"}],"sourceHashes":{"components/Components/Button/Button.jsx":"ec3e49d143ed","components/Components/Card/Card.jsx":"4861ae805b53","components/Components/DataTable/DataTable.jsx":"30f7249bc048","components/Components/Field/Field.jsx":"08643d8460c5","components/Components/FilterChip/FilterChip.jsx":"2e994a2eca7e","components/Components/Modal/Modal.jsx":"01be0141504f","components/Components/StatusPill/StatusPill.jsx":"1cb3a13a0011"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.FOBBookingAdmin_27b13c = window.FOBBookingAdmin_27b13c || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/Components/Button/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * FOB Button — primary (gradient), secondary (outline), and row-action sizes.
 * Press feedback is tint/brightness, never scale.
 */
function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  style = {},
  children,
  ...rest
}) {
  const pad = size === 'row' ? '5px 12px' : size === 'sm' ? '9px 16px' : '11px 20px';
  const radius = size === 'row' ? 'var(--radius-pill)' : 'var(--radius-button)';
  const fontSize = size === 'row' ? '11px' : '13px';
  const base = {
    font: `${variant === 'primary' ? 700 : 600} ${fontSize} var(--font-sans)`,
    padding: pad,
    borderRadius: radius,
    cursor: disabled ? 'default' : 'pointer',
    border: 'none',
    transition: 'filter 120ms ease, background 120ms ease',
    ...style
  };
  const variants = {
    primary: {
      color: '#fff',
      background: 'var(--gradient-brand)'
    },
    secondary: {
      color: 'var(--text-body)',
      background: 'transparent',
      border: '1px solid var(--wb16)'
    },
    ghost: {
      color: 'var(--text-body)',
      background: 'transparent',
      border: '1px solid var(--wb12)'
    },
    danger: {
      color: 'var(--pink-text-light)',
      background: 'transparent',
      border: '1px solid rgba(255,45,155,.45)'
    }
  };
  const disabledStyle = disabled ? {
    color: 'var(--text-faint)',
    background: 'transparent',
    border: '1px solid var(--wb16)',
    filter: 'none'
  } : null;
  const [hover, setHover] = React.useState(false);
  const hoverStyle = hover && !disabled ? variant === 'primary' ? {
    filter: 'brightness(1.06)'
  } : {
    background: 'var(--wb05)'
  } : null;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    disabled: disabled,
    onClick: disabled ? undefined : onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      ...base,
      ...variants[variant],
      ...hoverStyle,
      ...disabledStyle
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/Components/Button/Button.jsx", error: String((e && e.message) || e) }); }

// components/Components/Card/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * FOB Card — surface panel. Resting = 1px hairline, no shadow.
 * `elevation` opts into the console/email/modal drop shadows (overlays only).
 * `label` renders the mono uppercase eyebrow used across the console.
 */
function Card({
  label,
  elevation = 'none',
  pad = 20,
  style = {},
  children,
  ...rest
}) {
  const shadow = {
    none: 'none',
    console: 'var(--shadow-console)',
    email: 'var(--shadow-email)',
    modal: 'var(--shadow-modal)'
  }[elevation];
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--wb12)',
      borderRadius: 'var(--radius-card)',
      padding: pad,
      boxShadow: shadow,
      ...style
    }
  }, rest), label && /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-label)',
      letterSpacing: '1.4px',
      textTransform: 'uppercase',
      color: 'var(--text-label)',
      marginBottom: 14
    }
  }, label), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/Components/Card/Card.jsx", error: String((e && e.message) || e) }); }

// components/Components/DataTable/DataTable.jsx
try { (() => {
/**
 * FOB DataTable — the console list standard.
 * Grid rows (never inline flow), mono header labels, right-aligned money in Playfair,
 * mono ids in cyan, hover tint on rows.
 *
 * columns: [{ key, label, align, mono, money, width, render }]
 */
function DataTable({
  columns = [],
  rows = [],
  onRowClick,
  getRowKey,
  style = {}
}) {
  const template = columns.map(c => c.width || '1fr').join(' ');
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--wb12)',
      borderRadius: 'var(--radius-table)',
      overflow: 'hidden',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: template,
      background: 'var(--wb05)',
      borderBottom: '1px solid var(--wb09)'
    }
  }, columns.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.key,
    style: {
      padding: '11px 16px',
      font: 'var(--type-label)',
      letterSpacing: 'var(--tracking-label)',
      color: 'var(--text-label)',
      textTransform: 'uppercase',
      textAlign: c.align || 'left'
    }
  }, c.label))), rows.map((row, i) => /*#__PURE__*/React.createElement(Row, {
    key: getRowKey ? getRowKey(row) : i,
    columns: columns,
    row: row,
    template: template,
    onClick: onRowClick ? () => onRowClick(row) : undefined
  })));
}
function Row({
  columns,
  row,
  template,
  onClick
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'grid',
      gridTemplateColumns: template,
      alignItems: 'center',
      borderTop: '1px solid var(--wb05)',
      cursor: onClick ? 'pointer' : 'default',
      background: hover && onClick ? 'var(--wb03)' : 'transparent'
    }
  }, columns.map(c => {
    const raw = row[c.key];
    const content = c.render ? c.render(row) : raw;
    const font = c.money ? "600 15px var(--font-serif)" : c.mono ? "500 12px var(--font-mono)" : "500 12.5px var(--font-sans)";
    const color = c.money ? 'var(--text-price)' : c.mono ? 'var(--cyan-text-light)' : 'var(--text-body)';
    return /*#__PURE__*/React.createElement("div", {
      key: c.key,
      style: {
        padding: '13px 16px',
        textAlign: c.align || 'left',
        font,
        color,
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: c.wrap ? 'normal' : 'nowrap'
      }
    }, content);
  }));
}
Object.assign(__ds_scope, { DataTable });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/Components/DataTable/DataTable.jsx", error: String((e && e.message) || e) }); }

// components/Components/Field/Field.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * FOB Field — labelled form field. Label is muted 600/11px; money renders in Playfair.
 * Renders a display box by default, or an <input> when `editable`.
 */
function Field({
  label,
  hint,
  value,
  money = false,
  editable = false,
  onChange,
  placeholder,
  style = {},
  ...rest
}) {
  const boxStyle = {
    background: 'var(--wb05)',
    border: '1px solid var(--wb16)',
    borderRadius: 'var(--radius-field)',
    padding: money ? '10px 13px' : '11px 13px',
    font: money ? "600 18px var(--font-serif)" : "500 13.5px var(--font-sans)",
    color: money ? 'var(--pink-text-light)' : 'var(--text-strong)',
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none'
  };
  return /*#__PURE__*/React.createElement("label", _extends({
    style: {
      display: 'block',
      ...style
    }
  }, rest), label && /*#__PURE__*/React.createElement("div", {
    style: {
      font: "600 11px var(--font-sans)",
      color: 'var(--text-muted)',
      marginBottom: 6
    }
  }, label, hint && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--accent-orange)',
      marginLeft: 6
    }
  }, hint)), editable ? /*#__PURE__*/React.createElement("input", {
    value: value,
    onChange: onChange,
    placeholder: placeholder,
    style: boxStyle
  }) : /*#__PURE__*/React.createElement("div", {
    style: boxStyle
  }, value));
}
Object.assign(__ds_scope, { Field });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/Components/Field/Field.jsx", error: String((e && e.message) || e) }); }

// components/Components/FilterChip/FilterChip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * FOB FilterChip — a toolbar filter. Active = solid accent hue; idle = outlined fill.
 */
function FilterChip({
  active = false,
  onClick,
  style = {},
  children,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("span", _extends({
    role: "button",
    tabIndex: 0,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      font: "600 12px var(--font-sans)",
      padding: '8px 13px',
      borderRadius: 'var(--radius-field)',
      cursor: 'pointer',
      userSelect: 'none',
      transition: 'filter 120ms ease, background 120ms ease',
      color: active ? 'var(--pill-ink)' : 'var(--text-body)',
      background: active ? 'var(--accent-pink)' : 'var(--wb05)',
      border: `1px solid ${active ? 'var(--accent-pink)' : 'var(--wb16)'}`,
      filter: hover ? 'brightness(1.03)' : 'none',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { FilterChip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/Components/FilterChip/FilterChip.jsx", error: String((e && e.message) || e) }); }

// components/Components/Modal/Modal.jsx
try { (() => {
/**
 * FOB Modal — overlay dialog with a blurred scrim. Scrim + blur are the only
 * sanctioned uses of blur in the system. Adapts scrim to the active theme.
 */
function Modal({
  open,
  onClose,
  width = 440,
  theme = 'light',
  children
}) {
  if (!open) return null;
  const scrim = theme === 'console' ? 'var(--overlay-scrim-dark)' : 'var(--overlay-scrim)';
  const surface = theme === 'console' ? 'var(--plum-tint-1)' : 'var(--paper-hi)';
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: 'fixed',
      inset: 0,
      background: scrim,
      backdropFilter: 'var(--overlay-blur)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      animation: 'fobModalDim .2s ease'
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width,
      maxWidth: '92vw',
      background: surface,
      border: '1px solid var(--wb12)',
      borderRadius: 18,
      boxShadow: 'var(--shadow-modal)',
      overflow: 'hidden',
      animation: 'fobModalPop .28s cubic-bezier(.2,.8,.2,1)'
    }
  }, children), /*#__PURE__*/React.createElement("style", null, `
        @keyframes fobModalDim{from{opacity:0}to{opacity:1}}
        @keyframes fobModalPop{from{opacity:0;transform:scale(.96) translateY(10px)}to{opacity:1;transform:none}}
        @media (prefers-reduced-motion:reduce){[style*="fobModal"]{animation:none!important}}
      `));
}
Object.assign(__ds_scope, { Modal });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/Components/Modal/Modal.jsx", error: String((e && e.message) || e) }); }

// components/Components/StatusPill/StatusPill.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const STATUS = {
  succeeded: {
    label: 'succeeded',
    bg: 'var(--accent-lime)',
    fg: 'var(--pill-ink)'
  },
  requires_payment: {
    label: 'requires_payment',
    bg: 'var(--accent-pink)',
    fg: 'var(--pill-ink)'
  },
  refunded: {
    label: 'refunded',
    bg: 'rgba(34,211,238,.16)',
    fg: 'var(--cyan-text-light)'
  },
  failed: {
    label: 'failed',
    bg: 'var(--accent-orange)',
    fg: 'var(--pill-ink)'
  },
  no_show: {
    label: 'no_show',
    bg: 'var(--accent-orange)',
    fg: 'var(--pill-ink)'
  },
  draft: {
    label: 'draft',
    bg: 'var(--wb09)',
    fg: 'var(--text-muted)'
  }
};

/**
 * FOB StatusPill — a labelled capsule for a fixed booking/payment state.
 * Always carries a text label; never hue alone.
 */
function StatusPill({
  status = 'draft',
  label,
  style = {},
  ...rest
}) {
  const s = STATUS[status] || STATUS.draft;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      font: "600 10px var(--font-sans)",
      color: s.fg,
      background: s.bg,
      padding: '3px 9px',
      borderRadius: 'var(--radius-round)',
      whiteSpace: 'nowrap',
      display: 'inline-block',
      ...style
    }
  }, rest), label || s.label);
}
Object.assign(__ds_scope, { StatusPill });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/Components/StatusPill/StatusPill.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.DataTable = __ds_scope.DataTable;

__ds_ns.Field = __ds_scope.Field;

__ds_ns.FilterChip = __ds_scope.FilterChip;

__ds_ns.Modal = __ds_scope.Modal;

__ds_ns.StatusPill = __ds_scope.StatusPill;

})();
