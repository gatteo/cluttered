import { EcosystemId } from '../../shared/types';
import { EcosystemPlugin } from './types';
import { reactNativePlugin } from './plugins/react-native';
import { nodejsPlugin } from './plugins/nodejs';
import { rustPlugin } from './plugins/rust';
import { xcodePlugin } from './plugins/xcode';
import { pythonPlugin } from './plugins/python';
import { dockerPlugin } from './plugins/docker';
import { goPlugin } from './plugins/go';
import { androidPlugin } from './plugins/android';
import { rubyPlugin } from './plugins/ruby';
import { phpPlugin } from './plugins/php';
import { javaPlugin } from './plugins/java';
import { elixirPlugin } from './plugins/elixir';
import { dotnetPlugin } from './plugins/dotnet';

class EcosystemRegistry {
  private plugins = new Map<EcosystemId, EcosystemPlugin>();

  register(plugin: EcosystemPlugin) {
    this.plugins.set(plugin.id as EcosystemId, plugin);
  }

  get(id: EcosystemId): EcosystemPlugin | undefined {
    return this.plugins.get(id);
  }

  getAll(): EcosystemPlugin[] {
    return Array.from(this.plugins.values());
  }

  getAllConfigs() {
    return this.getAll().map((p) => ({
      id: p.id,
      name: p.name,
      icon: p.icon,
      color: p.color,
    }));
  }
}

export const ecosystemRegistry = new EcosystemRegistry();

// Register all plugins
// Note: Order matters! More specific plugins (react-native) should come before generic ones (nodejs)
ecosystemRegistry.register(reactNativePlugin);
ecosystemRegistry.register(nodejsPlugin);
ecosystemRegistry.register(rustPlugin);
ecosystemRegistry.register(xcodePlugin);
ecosystemRegistry.register(pythonPlugin);
ecosystemRegistry.register(dockerPlugin);
ecosystemRegistry.register(goPlugin);
ecosystemRegistry.register(androidPlugin);
ecosystemRegistry.register(rubyPlugin);
ecosystemRegistry.register(phpPlugin);
ecosystemRegistry.register(javaPlugin);
ecosystemRegistry.register(elixirPlugin);
ecosystemRegistry.register(dotnetPlugin);
