import React from 'react';
import { View, Text, Button, Image } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RouteStackParamList } from '../../navigation/types';
import { Routes } from '../../navigation/routes';
import { SplashScreenIllustration } from '../../../assets/images';
import RobotoText from '../../components/Text/Roboto';
import PrimaryButton from '../../components/Button/PrimaryButton';

type Props = StackScreenProps<RouteStackParamList, Routes.Splash>
const SplashScreen = ({ navigation }: Props) => {
    return (
        <View className='bg-black flex-1'>
            <View className="bg-[rgba(11,37,68,0.2)] flex-1 justify-between items-center p-5">
                <Image source={SplashScreenIllustration} className='mt-24 mb-32' />
                <View className='mb-auto'>
                    <RobotoText color='#A2A2A2' fontSize={18} className='text-center' >
                        Welcome to TimeZen
                    </RobotoText>
                    <RobotoText className='text-center mt-5' fontSize={32} color='#fff'>
                        Simple way to improve your screen time
                    </RobotoText>
                </View>
                <PrimaryButton onPress={() => { navigation.navigate(Routes.SetLimit) }} title='Get started' width={0.95} />

            </View>
        </View>
    );
};

export default SplashScreen;
