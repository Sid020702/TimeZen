import { RouteStackParamList } from "./types";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import SplashScreen from "../screens/SplashScreen";
import { Routes } from "./routes";
import SetLimitScreen from "../screens/SetLimit";

const Stack = createStackNavigator<RouteStackParamList>()

const AppNavigation = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName={Routes.Splash} screenOptions={{ headerShown: false }}>
                <Stack.Screen name={Routes.Splash} component={SplashScreen} />
                <Stack.Screen name={Routes.SetLimit} component={SetLimitScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    )
}

export default AppNavigation