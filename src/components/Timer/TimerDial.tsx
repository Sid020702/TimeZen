import React, { useEffect, useState } from 'react';
import { View, Pressable, Platform } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import Animated, {
    useSharedValue,
    useAnimatedProps,
    withTiming,
    Easing,
    useAnimatedReaction,
    runOnJS,
} from 'react-native-reanimated';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import RobotoText from '../Text/Roboto';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface TimerDialProps {
    pauseTargetApps: (durationInSeconds: number) => void;
}

const TimerDial = ({ pauseTargetApps }: TimerDialProps) => {
    const [timeLeft, setTimeLeft] = useState(0); // in seconds
    const [duration, setDuration] = useState(0); // total duration in seconds
    const [pickerVisible, setPickerVisible] = useState(false);
    const defaultDate: Date = new Date()
    defaultDate.setHours(0, 0, 0, 0)

    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;

    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');

    const radius = 135;
    const strokeWidth = 7;
    const blobRadius = 6;
    const canvasSize = radius * 2 + strokeWidth + blobRadius;
    const center = canvasSize / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = useSharedValue(0);

    // Animate progress whenever duration changes
    useEffect(() => {
        progress.value = 0;
        if (duration > 0) {
            progress.value = withTiming(1, {
                duration: duration * 1000,
                easing: Easing.linear,
            });
        }
        setTimeLeft(duration);
    }, [duration]);

    // Update timeLeft as animation progresses
    useAnimatedReaction(
        () => Math.floor((1 - progress.value) * duration),
        (newTime) => {
            runOnJS(setTimeLeft)(newTime);
        },
        [duration]
    );

    const animatedProps = useAnimatedProps(() => ({
        strokeDashoffset: circumference * (1 - progress.value),
    }));

    const blobPosition = useAnimatedProps(() => {
        const angle = 2 * Math.PI * progress.value;
        return {
            cx: center + radius * Math.cos(angle),
            cy: center + radius * Math.sin(angle),
        };
    });

    // Handle time picker change
    const onTimeChange = (event: DateTimePickerEvent,
        selectedDate: Date | undefined) => {
        setPickerVisible(Platform.OS === 'ios'); // keep picker visible on iOS
        if (selectedDate) {
            const totalSeconds = selectedDate.getHours() * 3600 + selectedDate.getMinutes() * 60;
            setDuration(totalSeconds);
            if (totalSeconds > 0) {
                console.log(totalSeconds)
                pauseTargetApps(totalSeconds)

            }
        }
    };

    return (
        <View className="items-center mt-14 relative w-full">
            {/* SVG Timer */}
            <Svg width={canvasSize} height={canvasSize}>
                <G rotation="-90" origin={`${center}, ${center}`}>
                    <Circle
                        cx={center}
                        cy={center}
                        r={radius}
                        stroke="#9981F13A"
                        strokeWidth={strokeWidth}
                        fill="white"
                    />
                    <AnimatedCircle
                        cx={center}
                        cy={center}
                        r={radius}
                        stroke="#9981F1"
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        fill="transparent"
                        strokeDasharray={`${circumference}, ${circumference}`}
                        animatedProps={animatedProps}
                    />
                    <AnimatedCircle r={blobRadius} fill="#9981F1" animatedProps={blobPosition} />
                </G>
            </Svg>

            {/* Text and Allow button */}
            <View className="absolute flex items-center justify-center top-1/2 -translate-y-[55] left-1/2 -translate-x-1/2">
                <Pressable onPress={() => setPickerVisible(true)}>
                    <RobotoText fontSize={20}>Allow</RobotoText>
                </Pressable>
                <RobotoText fontSize={50}>
                    {formattedHours}:{formattedMinutes}:{formattedSeconds}
                </RobotoText>
            </View>

            {/* Time Picker */}
            {pickerVisible && (
                <DateTimePicker
                    value={defaultDate}
                    mode="time"
                    is24Hour
                    onChange={(event, selectedDate) => onTimeChange(event, selectedDate)}
                />
            )}
        </View>
    );
};

export default TimerDial;
