import React, { FC, useEffect, useState } from "react";
import { TouchableOpacity, View, Image, ImageSourcePropType, Alert } from "react-native";
import RobotoText from "../../components/Text/Roboto";
import TimerDial from "../../components/Timer/TimerDial";
import { ScrollView } from "react-native-gesture-handler";
import { InstagramLogo, YoutubeLogo, TwitterLogo, ExpandDownArrow, ExpandUpArrow, ButtonToggled, ButtonOpen } from "../../../assets/images";
import Divider from "../../components/Divider/Divider";
import { NativeModules } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';


const SetLimitScreen: FC = () => {

    const { AccessibilityModule } = NativeModules;
    const [pickerDates, setPickerDates] = useState<Record<number, Date>>({});

    type DayName = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
    type DayInfo = {
        isActive: Boolean
    }

    type DayState = Record<DayName, DayInfo>;

    type SocialAppData = {
        logo: ImageSourcePropType,
        name: string,
        isToggled: boolean
        isSetLimitToggled: boolean
        limitHours: number,
        limitMinutes: number,
        packageName: string
    }

    const [days, setDays] = useState<DayState>({
        Monday: { isActive: true },
        Tuesday: { isActive: true },
        Wednesday: { isActive: true },
        Thursday: { isActive: true },
        Friday: { isActive: false },
        Saturday: { isActive: false },
        Sunday: { isActive: false },
    });

    const [socialAppData, setSocialAppData] = useState<SocialAppData[]>([
        {
            logo: YoutubeLogo,
            name: 'YouTube',
            isToggled: false,
            isSetLimitToggled: false,
            limitHours: 0,
            limitMinutes: 0,
            packageName: 'com.google.android.youtube'
        },

        {
            logo: TwitterLogo,
            name: 'Twitter',
            isToggled: false,
            isSetLimitToggled: false,
            limitHours: 0,
            limitMinutes: 0,
            packageName: 'com.twitter.android'
        },
        {
            logo: InstagramLogo,
            name: 'Instagram',
            isToggled: false,
            isSetLimitToggled: false,
            limitHours: 0,
            limitMinutes: 0,
            packageName: 'com.instagram.android'
        },
    ])

    const handleToggle = async (index: number) => {
        const app = socialAppData[index];

        if (!app.isToggled) {
            const hours = app.limitHours ?? 0;
            const minutes = app.limitMinutes ?? 0;

            if (hours === 0 && minutes === 0) {
                Alert.alert(
                    "Set Time Limit",
                    "Please set a time limit before enabling this app."
                );
                return;
            }
        }

        setSocialAppData(prev => {
            const updated = prev.map((item, i) =>
                i === index ? { ...item, isToggled: !item.isToggled } : item
            );

            const appDurationMap: Record<string, number> = {};

            updated.forEach(app => {
                if (app.isToggled) {
                    const hours = app.limitHours ?? 0;
                    const minutes = app.limitMinutes ?? 0;
                    appDurationMap[app.packageName] = hours * 60 + minutes;
                }
            });

            AccessibilityModule.setTargetApps(appDurationMap)
                .catch((err: any) => console.log(err));

            return updated;
        });
    };


    const handleToggleSetLimit = (index: number) => {
        setSocialAppData(prev => {
            const updated = prev.map((item, i) =>
                i === index ? { ...item, isSetLimitToggled: !item.isSetLimitToggled } : item
            );

            return updated;
        });
    }

    const onTimeChange = (event: DateTimePickerEvent,
        selectedDate: Date | undefined,
        idx: number) => {
        handleToggleSetLimit(idx)

        if (selectedDate) {
            const hours = selectedDate.getHours();
            const minutes = selectedDate.getMinutes();
            setSocialAppData(prev => {
                const updated = prev.map((item, i) =>
                    i === idx ? { ...item, limitHours: hours, limitMinutes: minutes } : item
                );

                return updated

            });
        }
    };

    const checkIfEnabled = async () => {
        const isEnabled = await AccessibilityModule.isAccessibilityServiceEnabled();
        if (!isEnabled) {
            Alert.alert(
                "Enable ScrollBlocker",
                "To detect scrolling in other apps, please enable Accessibility Service for ScrollBlocker.",
                [
                    {
                        text: "Cancel",
                        style: "cancel",
                    },
                    {
                        text: "Open Settings",
                        onPress: () => {
                            AccessibilityModule.openAccessibilitySettings();
                        },
                    },
                ]
            );
        }
    };

    function getTimeLeft(expiryMs: number) {
        const remainingMs = Math.max(expiryMs - Date.now(), 0)

        const totalSeconds = Math.floor(remainingMs / 1000)
        const hours = Math.floor(totalSeconds / 3600) // full hours only
        const minutes = Math.ceil((totalSeconds % 3600) / 60) // round up if any leftover seconds

        return { hours, minutes, remainingMs }
    }


    const mergeTargetApps = async () => {
        const targetApps: Record<string, number> = await AccessibilityModule.getTargetApps()
        setSocialAppData(prev => {
            const updated = prev.map(app => {
                const expiryMs = targetApps[app.packageName]

                if (expiryMs) {
                    const { hours, minutes } = getTimeLeft(expiryMs)
                    return {
                        ...app,
                        isToggled: true,
                        limitHours: hours,
                        limitMinutes: minutes
                    }
                }

                if (app.isToggled) {
                    return {
                        ...app,
                        isToggled: false,
                        limitHours: 0,
                        limitMinutes: 0
                    }
                } else {
                    return app
                }

            })

            return updated
        })
    }


    const pauseTargetApps = async (duration: number) => {
        try {
            // Call the native method
            const result = await AccessibilityModule.pauseTargetApps(duration);
            console.log('Apps paused successfully:', result);
            return result;
        } catch (err) {
            console.error('Failed to pause apps:', err);
            throw err;
        }
    };


    useEffect(() => {
        checkIfEnabled()
    }, [])

    useEffect(() => {
        setInterval(() => {
            mergeTargetApps()
        }, 5000)
    }, [])


    return (
        <ScrollView contentContainerStyle={{ flexGrow: 1, gap: 5, alignItems: 'center' }} contentContainerClassName='bg-[rgba(11, 37, 68, 0.16)] p-5'>
            <RobotoText fontSize={24} className="my-1">
                Set time limits
            </RobotoText>
            <RobotoText fontSize={20}>
                Set a screen time limit for each day of the week.
            </RobotoText>
            <View className="flex items-center w-full mt-5">
                <View className="flex flex-row justify-between w-full">
                    <RobotoText fontSize={18} color="#727272">Timing</RobotoText>
                    <RobotoText fontSize={18} color="#727272">Schedule</RobotoText>
                </View>
                <View className="w-full flex flex-row mt-3">
                    {
                        Object.entries(days).map(([dayName, dayInfo]) => (
                            <TouchableOpacity key={dayName} className={`flex-1 ${dayInfo?.isActive ? 'bg-black' : 'bg-white'} p-4 rounded-full`} onPress={() => {
                                setDays(prev => ({
                                    ...prev,
                                    [dayName]: {
                                        ...prev[dayName as DayName],
                                        isActive: !prev[dayName as DayName].isActive,
                                    },
                                }));
                            }}>
                                <RobotoText fontSize={18} type="semibold" className="text-center" color={dayInfo?.isActive ? 'white' : 'black'}>
                                    {dayName?.[0]?.toUpperCase()}
                                </RobotoText>
                            </TouchableOpacity>
                        ))
                    }
                </View>
                <TimerDial pauseTargetApps={pauseTargetApps} />

                <View className="flex w-full justify-center items-center mt-5">
                    {socialAppData?.map((appData, idx) => (
                        <React.Fragment key={appData.name}>
                            <View className="flex flex-row justify-center items-center gap-2 w-full px-4 py-2">
                                <Image source={appData.logo} className="w-10 h-10 rounded" />
                                <View className="flex justify-center flex-1 ml-2">
                                    <RobotoText type="medium" className="text-base">{appData.name}</RobotoText>
                                    <TouchableOpacity
                                        className="flex flex-row items-center mt-1"
                                        onPress={() => {
                                            handleToggleSetLimit(idx);
                                        }}
                                    >
                                        <RobotoText fontSize={12} color="#727272" className="mr-1">
                                            {appData.limitHours}h {appData.limitMinutes}m • Set time limit
                                        </RobotoText>
                                        <Image source={appData.isSetLimitToggled ? ExpandUpArrow : ExpandDownArrow} className="w-fit h-3" />
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity className="ml-auto" onPress={() => handleToggle(idx)}>
                                    <Image resizeMode="contain" source={appData?.isToggled ? ButtonToggled : ButtonOpen} />
                                </TouchableOpacity>
                            </View>

                            {/* Time Picker Modal */}
                            {appData?.isSetLimitToggled && (
                                <DateTimePicker
                                    mode="time"
                                    value={pickerDates[idx] || (() => {
                                        const date = new Date();
                                        date.setHours(appData.limitHours, appData.limitMinutes, 0, 0);
                                        return date;
                                    })()}
                                    is24Hour={true}
                                    onChange={(event, selectedDate) => {
                                        if (selectedDate) {
                                            setPickerDates(prev => ({ ...prev, [idx]: selectedDate }));
                                        }
                                        onTimeChange(event, selectedDate, idx);
                                    }}
                                />
                            )}

                            {idx < socialAppData.length - 1 && <Divider />}
                        </React.Fragment>
                    ))}
                </View>
            </View>
        </ScrollView>
    )
}

export default SetLimitScreen