import { View, Text, SafeAreaView, StyleSheet, Image, TextInput, TouchableOpacity, ScrollView } from "react-native";
import React, {useCallback, useState, useEffect} from "react";
import { StatusBar } from "expo-status-bar";
import {MagnifyingGlassIcon, XMarkIcon} from 'react-native-heroicons/outline'
import {MapPinIcon, CalendarDaysIcon} from 'react-native-heroicons/solid'
import { debounce } from "lodash";
import { fetchLocations, fetchWeatherForecast } from "../api/weather";
import {getData, storeData} from '../utils/asyncStorage';
import * as Progress from 'react-native-progress';
import { weatherImages } from "../constants";

const theme = {
    bgWhite: opacity => `rgba(255,255,255, ${opacity})`
}

export default function HomeScreen() {
    const [showSearch, toggleSearch] = useState(false)
    const [locations, setLocations] = useState([])
    const [loading, setLoading] = useState(true)
    const [weather, setWeather] = useState({})
    

    const handleLocation = async (loc) => {
        setLoading(true);
        toggleSearch(false);
        setLocations([]);
        try {
            const data = await fetchWeatherForecast({
                cityName: loc.name,
                days: '7'
            });
            setLoading(false);
            setWeather(data);
            storeData('city', loc.name);
        } catch (error) {
            console.error("Hava durumu verileri alınamadı:", error);
        }
    }
    
    const handleSearch = search => {
        // fetch locations
        if(search && search.length>2) {
            fetchLocations({cityName: search}).then(data => {
                setLocations(data);
            })
        }
    }

    useEffect(() => {
        fetchMyWeatherData();
    })

    const fetchMyWeatherData = async ()=>{
        let myCity = await getData('city');
        let cityName = 'İzmir';
        if(myCity){
          cityName = myCity;
        }
        fetchWeatherForecast({
          cityName,
          days: '7'
        }).then(data=>{
          // console.log('got data: ',data.forecast.forecastday);
          setWeather(data);
          setLoading(false);
        })
        
      }
    

    const handleTextDebounce = useCallback(debounce(handleSearch, 1200), []);

    const {location, current} = weather;

    return(
        <View style={styles.container}>
            <StatusBar style="light" />
            <Image
            blurRadius={50}
            source={require('../assets/images/bg.png')}
            style={styles.bgImg}
            />
            {
                loading? (
                    <View style={styles.loading}>
                        <Progress.CircleSnail thickness={10} size={140} color='#0bb3b2' />
                        </View>
                ): (

                
            <SafeAreaView style={styles.safeAreaView}>
                <View style={styles.searchContainer}>
                    <View style={[
                        styles.search,
                        { backgroundColor: showSearch ? theme.bgWhite(0.2) : 'transparent' },
                    ]}>
                       {
                        showSearch? (
                            <TextInput
                            onChangeText={handleTextDebounce}
                            placeholder="Search city"
                            placeholderTextColor={'lightgray'}
                            style={styles.searchText} 
                            />
                        ): null
                       }
                        <TouchableOpacity
                        onPress={()=> toggleSearch(!showSearch)}
                        style={[
                            styles.searchIcon,
                            { backgroundColor: showSearch ? theme.bgWhite(0.3) : 'transparent' },
                          ]}
                        >
                            <MagnifyingGlassIcon size={25} color={'white'} />
                        </TouchableOpacity>
                    </View>
                    {
                        locations.length>0 && showSearch? (
                            <View style={styles.locationContainer}>
                                {
                                    locations.map((loc, index) => {
                                        let showBorder = index+1 != locations.length;
                                        let borderStyle = showBorder? styles.border : '';
                                        return (
                                            <TouchableOpacity
                                            key= {index}
                                            onPress={() => handleLocation(loc)}
                                            style={[styles.locationButton, borderStyle]}>
                                                <MapPinIcon size={"20"} color={"gray"} />
                                                <Text style={styles.locationText}> {loc?.name}, {loc?.country} </Text>
                                            </TouchableOpacity>
                                        )
                                    })
                                }
                                </View>
                        ): null
                    }
                </View>
                <View style={styles.forecastSection}>
                    <Text style={styles.locationName}>
                        {location?.name}, 
                        <Text style={styles.countryName}>
                            {location?.country}
                        </Text>
                    </Text>
                    <View style={styles.weatherIconContainer}>
                        <Image
                        source={require('../assets/images/partlycloudy.png')}
                        style={styles.weatherIcon} />
                    </View>
                    <View style={styles.degreeCelcius}>
                        <Text style={styles.temperature}>
                            {current?.temp_c}&#176;
                        </Text>
                        <Text style={styles.condition}>
                        {current?.condition?.text}
                        </Text>
                    </View>


                    <View style={styles.stats}>
                        <View style={styles.infoContainer}>
                            <View style={styles.infoItem}>
                                <Image
                                source={require('../assets/icons/wind.png')}
                                style={styles.icon} />
                                <Text style={styles.infoText}>
                                {current?.wind_kph}km
                                </Text>
                            </View>
                            <View style={styles.infoItem}>
                                <Image
                                source={require('../assets/icons/drop.png')}
                                style={styles.icon} />
                                <Text style={styles.infoText}>
                                {current?.humidity}%
                                </Text>
                            </View>
                            <View style={styles.infoItem}>
                                <Image
                                source={require('../assets/icons/sun.png')}
                                style={styles.icon} />
                                <Text style={styles.infoText}>
                                { weather?.forecast?.forecastday[0]?.astro?.sunrise }
                                </Text>
                            </View>
                        </View>
                    </View>
                    </View>
                    
                    <View style={styles.nextDays}>
                        <View style={styles.heading}>
                            <View style={styles.headingIcon}>
                                <CalendarDaysIcon size={22} color={'white'} />
                            </View>
                            <Text style={styles.headingText}>
                                Daily Forecast
                            </Text>
                        </View>
                        <ScrollView
                        horizontal
                        contentContainerStyle={styles.forecastContainer}
                        showsHorizontalScrollIndicator={false}
                        >
                            {
                                weather?.forecast?.forecastday?.map((item,index)=>{
                                    const date = new Date(item.date);
                                    const options = { weekday: 'long' };
                                    let dayName = date.toLocaleDateString('en-US', options);
                                    dayName = dayName.split(',')[0];

                                    return (
                                        <View
                                        key={index}
                                        style={styles.dailyForecast}
                                        >
                                            <Image 
                                            source={weatherImages[item?.day?.condition?.text || 'other']}
                                            style={styles.forecastIcon} />
                                            <Text style={styles.dayName}>{dayName}</Text>
                                            <Text style={styles.dayTemperature}>
                                                {item?.day?.avgtemp_c}&#176;
                                            </Text>

                                        </View>
                                    )
                            })
                        }
                        </ScrollView>
                    </View>
                    
                
            </SafeAreaView>
            )
        }
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: "relative",
    },
    bgImg: {
        position: 'absolute',
        height: '100%',
        width: '100%',
    },
    safeAreaView: {
        flex: 1,
    },
    searchContainer: {
        height: '7%',
        marginHorizontal: 16,
    },
    search: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        borderRadius: 999,
    },
    searchText: {
        flex: 1,
        paddingLeft: 17,
        height: 40,
        //position: 'absolute',
        fontSize: 18,
        color: 'white',
        
    },
    searchIcon: {
        backgroundColor: theme.bgWhite(0.3),
        borderRadius: 999,
        padding: 12,
        margin: 4,

    },
    locationContainer: {
        position: 'absolute',
        width: '100%',
        backgroundColor: 'white',
        borderRadius: 12,
        top: 64
        
    },
    locationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 0,
        padding: 12,
        paddingHorizontal: 16,
        marginBottom: 4,
    },
    border: {
        borderBottomWidth: 2,
        borderBottomColor: 'gray'
    },
    locationText: {
        color: 'black',
        fontSize: 18,
        marginLeft: 8
    },
    forecastSection: {
        marginHorizontal: 16,
        //flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginBottom: 8,
    },
    locationName: {
        color: 'white',
        textAlign: 'center',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 17
    },
    countryName: {
        color: 'gray',
        fontSize: 18,
        fontWeight: '600'
    },
    weatherIconContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    weatherIcon: {
        width: 208,
        height: 208,
        marginTop: 21,
    },
    degreeCelcius: {
        marginVertical: 21,
    },
    temperature: {
        fontSize: 75,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        marginLeft: 20,
    },
    condition: {
        fontSize: 24,
        color: 'white',
        textAlign: 'center',
        letterSpacing: 2,
    },
    stats: {
        marginHorizontal: 16,
        marginTop: 35,
        //flexDirection: 'row'
    },
    infoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 29,
    },
    icon: {
        width: 24,
        height: 24,
    },
    infoText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
        marginLeft: 5,
    },
    nextDays: {
        marginBottom: 8,
        marginHorizontal: 16,
        marginTop: 21
    },
    heading: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    headingIcon: {
        marginRight: 8
    },
    headingText: {
        fontSize: 18,
        color: 'white'
    },
    forecastContainer: {
        paddingHorizontal: 5,
    },
    dailyForecast: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 85,
        borderRadius: 24,
        paddingVertical: 12,
        marginRight: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.15)'

    },
    forecastIcon: {
        width: 44,
        height: 44,
    },
    dayName: {
        color: 'white'
    },
    dayTemperature: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    }
    
})