import { registerRootComponent } from 'expo';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { installGlobalErrorHandler } from './src/lib/runtimeErrors';

installGlobalErrorHandler();

function Root() {
  const App = require('./src/App').default;

  return (
    <SafeAreaProvider>
      <App />
    </SafeAreaProvider>
  );
}

registerRootComponent(Root);
