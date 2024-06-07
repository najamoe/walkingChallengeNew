import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { IconButton } from "react-native-paper";
import { auth, firestore, storage } from "../firebase/FirebaseConfig";
import { ref, getDownloadURL } from "firebase/storage";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  setDoc, query, where
} from "firebase/firestore";
import { ProgressBar } from "react-native-paper";
import * as Location from "expo-location";

const HomePage = ({ navigation }) => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [challenges, setChallenges] = useState([]);
  const [userChallenges, setUserChallenges] = useState([]);
  const [location, setLocation] = useState(null);
  const [distanceWalked, setDistanceWalked] = useState(0);
  const [prevLocation, setPrevLocation] = useState(null);
  const [completedChallenges, setCompletedChallenges] = useState([]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestBackgroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Location permission is required to use this app properly. Go to settings to grant the permission.",
          [{ text: "OK" }]
        );
        
        return;
      }

      Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 1 },
        (location) => {
          setLocation(location);
          // Calculate distance walked from previous location to current location
          if (
            prevLocation &&
            location.coords &&
            location.coords.latitude &&
            location.coords.longitude
          ) {
            const newDistance = distanceBetweenCoordinates(
              prevLocation.coords.latitude,
              prevLocation.coords.longitude,
              location.coords.latitude,
              location.coords.longitude
            );
            setDistanceWalked((prevDistance) => prevDistance + newDistance);
            updateFirestoreDistance(prevDistance + newDistance);
          }
          setPrevLocation(location);
        }
      );
    })();
  }, [prevLocation]);

  const distanceBetweenCoordinates = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1); // deg2rad below
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d * 1000; // Convert to meters
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };

  const updateFirestoreDistance = async (distance) => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userChallengesRef = doc(
          firestore,
          "UserChallenges",
          currentUser.uid
        );
        await updateDoc(userChallengesRef, { distanceWalked: distance });
        challenges.forEach((challenge) => {
          if (distance >= challenge.Distance) {
            markChallengeComplete(currentUser.uid, challenge.id);
          }
        });
      }
    } catch (error) {
      alert("Error updating Firestore distance:", error);
    }
  };
  
  const markChallengeComplete = async (userId, challengeId) => {
    try {
      const completedChallengeRef = doc(
        firestore,
        "CompletedChallenges",
        userId
      );
  
      await setDoc(completedChallengeRef, {
        userId: userId,
        challengeId: challengeId,
        
      });
  
      setCompletedChallenges(prevCompletedChallenges => {
        const updatedCompletedChallenges = [...prevCompletedChallenges, {
          id: challengeId, 
          name: challenge.name, 
          distance: challenge.distance,
          
        }];
        return updatedCompletedChallenges;
      });
    } catch (error) {
      alert("Error marking challenge as completed:", error);
    }
  };
  
  

  const fetchChallenges = async () => {
    try {
      const challengesCollection = await getDocs(
        collection(firestore, "Challenges")
      );
      const challengesData = await Promise.all(
        challengesCollection.docs.map(async (doc) => {
          const imgRef = ref(storage, doc.data().img);
          const imgURL = await getDownloadURL(imgRef);
          
          return {
            id: doc.id,
            ...doc.data(),
            img: imgURL,
          };
        })
      );
      setChallenges(challengesData);
    } catch (error) {
     
    }
  };

  useEffect(() => {
    fetchChallenges(); // side effect only runs once when component is mounted
  }, []);

  const fetchUserChallenges = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
       
        return;
      }

      const userChallengesRef = doc(
        firestore,
        "UserChallenges",
        currentUser.uid
      );
      const userChallengesDoc = await getDoc(userChallengesRef);
      if (userChallengesDoc.exists()) {
        const userChallengesData = userChallengesDoc.data();
        if (userChallengesData && userChallengesData.challengeId) {
          const challengeId = userChallengesData.challengeId;
          setUserChallenges([challengeId]);
        }
      } else {
        
      }
    } catch (error) {
      
      Alert.alert(
        "Error",
        "Failed to fetch user challenges. Please try again later."
      );
    }
  };

  useEffect(() => {
    fetchUserChallenges(); //Side effect runs everytime the dependency array updates
  }, [distanceWalked]);

  useEffect(() => {
    fetchCompletedChallenges(); // Side effect to fetch completed challenges
  }, [completedChallenges]);
  
  const fetchCompletedChallenges = async () => {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
           
            return;
        }

        const completedChallengesCollection = await getDocs(
            query(
                collection(firestore, "CompletedChallenges"),
                where("userId", "==", currentUser.uid)
            )
        );

        const completedChallengesData = await Promise.all(
          completedChallengesCollection.docs.map(async (docSnapshot) => {
            const challengeId = docSnapshot.data().challengeId;
        
            const challengeDoc = await getDoc(doc(firestore, "Challenges", challengeId)); // Fejl her
            const challengeData = challengeDoc.exists() ? challengeDoc.data() : null;
        
            if (challengeData) {
              const imgRef = ref(storage, challengeData.img);
              const imgURL = await getDownloadURL(imgRef);
        
              return {
                id: challengeId,
                name: challengeData.name,
                img: imgURL,
                distance: challengeData.Distance
              };
            } else {
              return null;
            }
          })
        );

        setCompletedChallenges(completedChallengesData);
    } catch (error) {
       
    }
};

  const handleSignOut = () => {
    auth
      .signOut()
      .then(() => {
        navigation.navigate("Login");
      })
      .catch((error) => {
       
      });
  };

  const handleScroll = (event) => {
    const { contentOffset } = event.nativeEvent;
    setScrollPosition(contentOffset.y);
    if (contentOffset.y === 0) {
      fetchChallenges();
      fetchUserChallenges();
    }
  };

  const renderChallenge = ({ item }) => (
    <TouchableOpacity style={styles.challengeContainer}>
      <Image source={{ uri: item.img }} style={styles.image} />
      <Text style={styles.title}>{item.name}</Text>
      <Text style={styles.description}>{item.Description}</Text>
      <Text style={styles.distance}>Distance: {item.Distance}</Text>
      <TouchableOpacity
        style={styles.startButton}
        onPress={() => startChallenge(item.id)}
      >
        <Text style={styles.startButtonText}>Start this challenge</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderUserChallenge = ({
    id,
    img,
    name,
    Description,
    Distance,
    completed,
  }) => {
    const progress = (distanceWalked / Distance) * 100;

    return (
      <View style={styles.challengeContainer}>
        <Image source={{ uri: img }} style={styles.image} />
        <Text style={styles.title}>{name}</Text>
        <Text style={styles.description}>{Description}</Text>
        <Text style={styles.distance}>Distance: {Distance}</Text>
        {completed && <Text style={styles.completedText}>Completed</Text>}
        <ProgressBar
          progress={progress / 100}
          color="#1A4D2E"
          style={styles.progressBar}
        />
      </View>
    );
  };

  const renderCompletedUserChallenge = ({ id, img, name, distance }) => {
      return (
        <View style={styles.challengeContainer}>
          <Image source={{ uri: img }} style={styles.image} />
          <Text style={styles.title}>{name}</Text>
          <Text style={styles.distance}>Distance: {distance}</Text>
        </View>
      );
    };
  
  const startChallenge = async (challengeId) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return;
      }

      const userChallengesRef = doc(
        firestore,
        "UserChallenges",
        currentUser.uid
      );
      const userChallengesDoc = await getDoc(userChallengesRef);

      if (!userChallengesDoc.exists()) {
        // If the user document doesn't exist, create a new one
        await setDoc(userChallengesRef, {
          userId: currentUser.uid,
          challengeId: challengeId,
          distanceWalked: 0,
        });

        // Update userChallenges state to include the new challengeId
        setUserChallenges([challengeId]);
      } else {
        // User already has an active challenge
        const activeChallengeId = userChallengesDoc.data().challengeId;
        if (activeChallengeId !== challengeId) {
          // Confirm switch challenge
          Alert.alert(
            "Switch Challenge",
            "You already have an active challenge. If you choose this challenge, your progress on the active challenge will be deleted. Do you wish to switch to this challenge?",
            [
              {
                text: "No",
                style: "cancel",
              },
              {
                text: "Yes",
                onPress: async () => {
                  // Update challengeId and delete distanceWalked for the new challenge
                  await switchChallenge(challengeId, activeChallengeId);
                },
              },
            ]
          );
        } else {
          Alert.alert(
            "Duplicate Challenge",
            "You are already participating in this challenge."
          );
        }
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to start challenge. Please try again later."
      );
    }
  };

  const switchChallenge = async (newChallengeId, activeChallengeId) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        
        return;
      }

      // Update user challenges with the new challenge and reset distanceWalked
      await updateDoc(doc(firestore, "UserChallenges", currentUser.uid), {
        challengeId: newChallengeId,
        distanceWalked: 0,
      });

      // Fetch the details of the new challenge
      const newChallengeRef = doc(firestore, "Challenges", newChallengeId);
      const newChallengeDoc = await getDoc(newChallengeRef);
      if (newChallengeDoc.exists()) {
        const newChallengeData = {
          id: newChallengeDoc.id,
          ...newChallengeDoc.data(),
          img: await getDownloadURL(ref(storage, newChallengeDoc.data().img)),
        };

        // Update the userChallenges array by appending the new challenge
        setUserChallenges((prevChallenges) => [
          ...prevChallenges,
          newChallengeData,
        ]);

        fetchUserChallenges();
      } else {
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to switch challenge. Please try again later."
      );
    }
  };

  return (
    <ScrollView
      style={styles.container}
      onScroll={handleScroll}
      scrollEventThrottle={16}
    >
      <View style={styles.logoContainer}>
        <Image
          source={require("../assets/JourneyWalker-removebg-preview.png")}

          style={styles.logo}
        /> 
      </View>

      <IconButton
        icon="logout"
        color="#000"
        size={30}
        onPress={handleSignOut}
        style={styles.signOutIcon}
      />

      {userChallenges.length > 0 && (
        <View style={styles.userChallengesContainer}>
          <Text style={styles.userChallengesTitle}>Your active Challenges</Text>
          <Text style={styles.distance}>
            Distance Walked: {distanceWalked.toFixed(2)} meters
          </Text>

          <View style={styles.scrollViewContent}>
            {challenges.map((challenge) => {
              if (userChallenges.includes(challenge.id)) {
                return (
                  <View key={challenge.id} style={styles.challengeWrapper}>
                    {renderUserChallenge(challenge)}
                  </View>
                );
              } else {
                return null;
              }
            })}
          </View>
        </View>
      )}

      <View style={styles.challengesContainer}>
        <Text style={styles.challenges}>New challenge</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
        >
          {challenges.map((challenge) => (
            <View key={challenge.id} style={styles.challengeWrapper}>
              {renderChallenge({ item: challenge })}
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.completedChallengesContainer}>
        <Text style={styles.completedChallenges}>Completed challenges</Text>
        {userChallenges.length > 0 && (
          <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
        >
          {completedChallenges.map((challenge) => {
            return (
              <View key={challenge.id} style={styles.challengeWrapper}>
                {renderCompletedUserChallenge(challenge)}
              </View>
            );
          })}
        </ScrollView>
        
        )}
        {userChallenges.length === 0 && (
          <View style={styles.noCompletedChallengesContainer}>
            <Image
              source={require("../assets/sadtrophy.png")}
              style={styles.sadTrophyImage}
            />
            <Text style={styles.noCompletedChallengesText}>
              You have no completed challenges
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F5EFE6",
    flex: 1,
    padding: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 5,
  },
  logo: {
    width: 200,
    height: 150,
    resizeMode: "cover",
  },
  signOutIcon: {
    alignSelf: "center",
    marginTop: 5,
  },
  challengesContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    marginVertical: 5,
    marginHorizontal: 0,
    width: 345,
    height: 380,
  },
  image: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
  },
  description: {
    fontSize: 16,
    marginBottom: 5,
  },
  distance: {
    fontSize: 16,
    marginBottom: 10,
  },
  startButton: {
    backgroundColor: "#1A4D2E",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  startButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  scrollViewContent: {
    justifyContent: "center",
    alignItems: "center",
    flexGrow: 1,
  },
  challengeWrapper: {
    marginRight: 10,
    alignItems: "center",
    width: 295,
  },
  userChallengesContainer: {
    backgroundColor: "#ffffff",
    marginBottom: 20,
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    alignSelf: "stretch",
  },
  userChallengesTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  challenges: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  completedChallenges: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  completedChallengesContainer: {
    backgroundColor: "#ffffff",
    marginBottom: 20,
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    alignSelf: "stretch",
  },
  noCompletedChallengesContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  sadTrophyImage: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  noCompletedChallengesText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default HomePage;
