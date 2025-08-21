interface BadgeConfig {
  icon?: string;
  color?: string;
  background?: string;
}

interface BadgeParser {
  (value: any): Array<{ key: string; value: any }>;
}

interface SingleBadgeField {
  fieldName: string;
  badge: BadgeConfig;
  parser?: BadgeParser;
}

interface MultiBadgeField {
  fieldName: string;
  badges: { [key: string]: BadgeConfig };
  parser?: BadgeParser;
}

type FieldConfig = SingleBadgeField | MultiBadgeField;

interface PluginConfig {
  fields: FieldConfig[];
  defaultIcon?: string;
  defaultColor?: string;
  defaultBackground?: string;
}

interface PluginSystem {
  React: any;
  specSelectors: any;
  pluginConfig: PluginConfig;
  defaultParser: BadgeParser;
  isSingleBadgeField: (field: FieldConfig) => field is SingleBadgeField;
  isMultiBadgeField: (field: FieldConfig) => field is MultiBadgeField;
}

const defaultParser: BadgeParser = (value: any) => {
  if (!value) return [];

  if (typeof value === 'string') {
    return value.split(',').map((item: string, index: number) => ({
      key: `badge-${index}`,
      value: item.trim(),
    }));
  }

  if (Array.isArray(value)) {
    return value.map((item: any, index: number) => ({
      key: `badge-${index}`,
      value: item,
    }));
  }

  if (typeof value === 'object') {
    return Object.entries(value).map(([key, val]) => ({
      key: key,
      value: val,
    }));
  }

  return [];
};

const isSingleBadgeField = (field: FieldConfig): field is SingleBadgeField => {
  return 'badge' in field;
};

const isMultiBadgeField = (field: FieldConfig): field is MultiBadgeField => {
  return 'badges' in field;
};

const injectBadgeStyles = () => {
  if (document.getElementById('swagger-badge-styles')) return;

  const style = document.createElement('style');
  style.id = 'swagger-badge-styles';
  style.textContent = `
    .operation-with-badges {
      display: flex;
      flex-direction: column;
      gap: 4px;
      border: 1px solid #50e3c2;
      border-radius: 4px;
      margin: 0 0 15px;

      .opblock {
        margin: 0;
        border: none;
      }
    }

    .badges {
      display: flex;
      flex-direction: row;
      gap: 10px;
      padding: 5px;
    }

    .swagger-custom-badge {
      display: inline-block;
      padding: 2px 6px;
      margin: 2px 4px 2px 0;
      font-size: 11px;
      font-weight: bold;
      border-radius: 3px;
      color: white;
    }
  `;

  document.head.appendChild(style);
};

const wrapOperation = (OriginalOperation: any, system: PluginSystem) => (props: any) => {
  const pluginConfig = system.pluginConfig;
  const spec = system.specSelectors.spec();
  const specPath = props.specPath;

  const allBadges: any[] = [];

  for (const fieldConfig of pluginConfig.fields) {
    let xFieldValue: any = null;
    if (spec && specPath && spec.getIn) {
      const operationSpec = spec.getIn([...specPath]);
      if (operationSpec && operationSpec.get) {
        xFieldValue = operationSpec.get(fieldConfig.fieldName);
      }
    }

    if (xFieldValue === undefined || xFieldValue === null) continue;

    const fieldValue = xFieldValue.toJS ? xFieldValue.toJS() : xFieldValue;
    const parser = fieldConfig.parser || system.defaultParser;
    const parsedBadges = parser(fieldValue);

    const fieldBadges = parsedBadges.map((badge) => {
      let badgeConfig: BadgeConfig = {};

      if (system.isSingleBadgeField(fieldConfig)) {
        badgeConfig = fieldConfig.badge;
      } else if (system.isMultiBadgeField(fieldConfig)) {
        badgeConfig = fieldConfig.badges[badge.key] || {};
      }

      const displayValue = badge.value;
      const icon = badgeConfig.icon || pluginConfig.defaultIcon;
      const bgColor = badgeConfig.background || pluginConfig.defaultBackground;
      const color = badgeConfig.color || pluginConfig.defaultColor;

      return system.React.createElement(
        'span',
        {
          key: `${fieldConfig.fieldName}-${badge.key}`,
          className: `swagger-custom-badge`,
          title: `${badge.key}: ${displayValue}`,
          style: {
            backgroundColor: bgColor,
            color: color,
          },
        },
        `${icon} ${displayValue}`,
      );
    });

    allBadges.push(...fieldBadges);
  }

  if (allBadges.length === 0) {
    return system.React.createElement(OriginalOperation, props);
  }

  return system.React.createElement('div', { className: 'operation-with-badges' }, [
    system.React.createElement('div', { className: 'badges' }, allBadges),
    system.React.createElement(OriginalOperation, {
      ...props,
      key: 'operation',
    }),
  ]);
};

const defaultConfig: PluginConfig = {
  fields: [],
  defaultIcon: '🏷️',
  defaultColor: 'white',
  defaultBackground: '#50e3c2',
};

export const CustomBadgePlugin = (config: PluginConfig) => {
  return {
    rootInjects: {
      pluginConfig: {
        ...defaultConfig,
        ...config,
      },
      defaultParser,
      isSingleBadgeField,
      isMultiBadgeField,
      injectBadgeStyles,
    },
    wrapComponents: {
      operation: wrapOperation,
    },
    afterLoad: function (system: any) {
      this.rootInjects.injectBadgeStyles();
    },
  };
};

export default CustomBadgePlugin;
