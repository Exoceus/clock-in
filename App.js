import { Pressable, StyleSheet, Text, SafeAreaView as View, ScrollView, RefreshControl } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

function HomeScreen() {
  const [isStarted, setStarted] = useState(false)
  const [duration, setDuration] = useState("")
  const [startTime, setStartTime] = useState(null)
  const [time, setTime] = useState(null)

  useEffect(() => {
    let interval = setInterval(() => setTime(new Date().getTime()), 100)
    AsyncStorage.getItem('clock_in').then(res => {
      if (res) {
        setStarted(true)
        setStartTime(res)
      }
    })
    return () => clearInterval(interval)
  }, [])

  const startShift = () => {
    let date = Date.now();
    console.log("DATE", date)
    AsyncStorage.setItem("clock_in", date.toString()).then(() => {
      console.log("entered", date)
      setStarted(true)
      setStartTime(date.toString())
    })
  }

  const endShift = () => {
    console.log("HELLO")
    let endTime = time;
    AsyncStorage.getItem("history").then(history => {
      if (history) {
        history = JSON.parse(history)
      } else {
        history = []
      }
      history.push({ start: startTime, end: endTime, id: uuidv4() })

      AsyncStorage.setItem("history", JSON.stringify(history)).then(res => {
        console.log(res)
      })
    })
    AsyncStorage.removeItem("clock_in").then(() => {
      setStarted(false)
      setStartTime(null)
    })
  }


  useEffect(() => {
    if (isStarted && startTime) {
      const duration = new Date().getTime() - startTime;
      const seconds = Math.floor(duration / 1000);
      const minutes = Math.floor(seconds / 60)
      const hours = Math.floor(minutes / 60)

      function displayTime(num, conversion) {
        return `${num % conversion < 10 ? '0' + num % conversion : num % conversion}`
      }

      setDuration(`${displayTime(hours, 60)}:${displayTime(minutes, 60)}:${displayTime(seconds, 60)}`)
    }
  }, [time])


  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: 32, }}>
      <Pressable title='Start Shift' onPress={e => startShift()} style={{ borderRadius: 24, width: '100%', backgroundColor: '#eb7c50', padding: 12, opacity: isStarted ? 0.5 : 1, marginBottom: 24 }} disabled={isStarted}><Text style={{ textAlign: 'center', fontSize: 18, color: 'white' }}>Start Shift</Text></Pressable>
      {duration && isStarted ? <Text style={{ fontSize: 36, paddingTop: 8, paddingBottom: 8 }}>{duration}</Text> : null}
      <Pressable onPress={e => endShift()} style={{ borderRadius: 24, width: '100%', backgroundColor: '#eb7c50', padding: 12, opacity: isStarted ? 1 : 0.5, marginTop: 24 }} disabled={!isStarted}><Text style={{ textAlign: 'center', fontSize: 18, color: 'white' }}>End Shift</Text></Pressable>
    </View >
  );
}


function HistoryScreen() {
  const [record, setRecord] = useState([])
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('history').then(res => {
      if (res) {
        res = JSON.parse(res)

        let byDate = {}

        res.forEach(entry => {
          let start = new Date();
          start.setTime(entry.start)
          let date = `${start.getFullYear()},${start.getMonth()},${start.getDate()}`
          if (byDate[date]) {
            byDate[date].push(entry)
          } else {
            byDate[date] = [entry]
          }
        })

        setRecord(byDate)
      }
    })
  }, [])

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    AsyncStorage.getItem('history').then(res => {
      if (res) {
        res = JSON.parse(res)

        let byDate = {}

        res.forEach(entry => {
          let start = new Date();
          start.setTime(entry.start)
          let date = `${start.getFullYear()},${start.getMonth()},${start.getDate()}`
          if (byDate[date]) {
            byDate[date].push(entry)
          } else {
            byDate[date] = [entry]
          }
        })

        setRecord(byDate)
        setRefreshing(false)
      } else {
        setRefreshing(false)
      }
    })
  }, []);

  const deleteShift = (date) => {
    let shifts = record[date];
    setRefreshing(true)
    AsyncStorage.getItem('history').then(res => {
      if (res) {
        res = JSON.parse(res)

        let newStore = res.filter(entry => {
          return !shifts.some(shift => {
            return shift.id === entry.id
          })
        })
        AsyncStorage.setItem("history", JSON.stringify(newStore)).then(() => {
          AsyncStorage.getItem("history").then((res) => {
            if (res) {
              res = JSON.parse(res)

              let byDate = {}

              res.forEach(entry => {
                let start = new Date();
                start.setTime(entry.start)
                let date = `${start.getFullYear()},${start.getMonth()},${start.getDate()}`
                if (byDate[date]) {
                  byDate[date].push(entry)
                } else {
                  byDate[date] = [entry]
                }
              })

              setRecord(byDate)
              setRefreshing(false)
            } else {
              setRefreshing(false)
            }
          })
        })
      } else {
        throw ("BRUH")
      }
    })
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {Object.entries(record).map(([date, entries]) => {
          let d = new Date();
          let [year, month, day] = date.split(',')
          console.log(year, month, day)
          d.setDate(day); d.setMonth(month); d.setFullYear(year);

          let totalTime = entries.reduce((partialSum, entry) => partialSum + entry.end - entry.start, 0)
          const seconds = Math.floor(totalTime / 1000);
          const minutes = Math.floor(seconds / 60)
          const hours = Math.floor(minutes / 60)

          console.log(totalTime)

          let timeDisplay = `${hours > 0 ? hours + ' hrs, ' : ""}${minutes + ' mins'}`

          return <View style={{ width: '100%', padding: 32 }}>
            <Text style={{ color: "#eb7c50", fontWeight: "bold", fontSize: 24, textAlign: 'center', marginBottom: 8 }}>{d.toDateString()}</Text>
            <Text style={{ color: "grey", fontSize: 20, textAlign: 'center', marginBottom: 16 }}>(Worked {timeDisplay})</Text>
            <View style={{ flexDirection: 'column' }}>
              {entries.map(entry => {
                let start = new Date();
                start.setTime(entry.start)

                let end = new Date();
                end.setTime(entry.end)

                return <View style={{ borderBottomWidth: 2, borderColor: 'black', paddingTop: 8, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.entry}>{`${start.getHours() % 12 || 12}:${start.getMinutes() < 10 ? "0" + start.getMinutes() : start.getMinutes()} ${start.getHours() >= 12 ? "PM" : "AM"}`}</Text>
                  <Text style={styles.entry}>-</Text>
                  <Text style={styles.entry}>{`${end.getHours() % 12 || 12}:${end.getMinutes() < 10 ? "0" + end.getMinutes() : start.getMinutes()} ${end.getHours() >= 12 ? "PM" : "AM"}`}</Text>
                </View>
              })}
              <Pressable onPress={e => deleteShift(date)} style={{ borderRadius: 24, width: '100%', backgroundColor: 'red', padding: 4, marginTop: 8 }}><Text style={{ textAlign: 'center', fontSize: 18, color: 'white' }}>Delete</Text></Pressable>
            </View>
          </View>
        })}
        {Object.keys(record).length === 0 ? <Text>No Shifts Found</Text> : null}
      </ScrollView>
    </View>
  );
}

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: '#eb7c50', tabBarLabelStyle: { fontSize: 12, marginBottom: 12 }, tabBarStyle: { height: 75, padding: 12 } }}>
        <Tab.Screen name="Home" component={HomeScreen} options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="home" size={size} color={color} />
        }} />
        <Tab.Screen name="History" component={HistoryScreen} options={{
          tabBarLabel: "History",
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="history" size={size} color={color} />
        }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%'
  },
  entry: {
    fontSize: 18
  }
});