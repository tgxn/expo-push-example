import React, { useState, useEffect, useRef } from "react";

import * as Notifications from "expo-notifications";
// import Constants from "expo-constants";
import * as Device from "expo-device";

import { Text, View, Button, Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState("");

  const [notification, setNotification] = useState(false);
  const [notificationResponse, setNotificationResponse] = useState(false);

  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    async function prepare() {
      const token = await registerForPushNotificationsAsync();
      setExpoPushToken(token);

      await Notifications.setNotificationCategoryAsync("submit_reply", [
        {
          identifier: "reply",
          buttonTitle: "Reply",
          textInput: {
            submitButtonTitle: "Reply",
          },
          options: {
            opensAppToForeground: false,
          },
        },
      ]);
      await Notifications.setNotificationCategoryAsync(
        "submit_reply_placeholder",
        [
          {
            identifier: "reply",
            buttonTitle: "Reply",
            textInput: {
              submitButtonTitle: "Reply",
              placeholder: "Type a reply...",
            },
            options: {
              opensAppToForeground: false,
            },
          },
        ]
      );
      await Notifications.setNotificationCategoryAsync(
        "submit_reply_foreground",
        [
          {
            identifier: "reply",
            buttonTitle: "Reply",
            textInput: {
              submitButtonTitle: "Reply",
            },
            options: {
              opensAppToForeground: true,
            },
          },
        ]
      );
      await Notifications.setNotificationCategoryAsync(
        "submit_reply_foreground_placeholder",
        [
          {
            identifier: "reply",
            buttonTitle: "Reply",
            textInput: {
              submitButtonTitle: "Reply",
              placeholder: "Type a reply...",
            },
            options: {
              opensAppToForeground: true,
            },
          },
        ]
      );
    }
    prepare();

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("incoming notificaiton", JSON.stringify(notification));
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("notification reponse", JSON.stringify(response));
        setNotificationResponse(response);

        // dismiss notification
        Notifications.dismissNotificationAsync(
          response.notification.request.identifier
        );
      });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  const pushDirect = async (to, categoryId) => {
    console.log("Sending push to", to);
    const reply = await fetch("https://exp.host/--/api/v2/push/send", {
      body: JSON.stringify({
        to,
        categoryId,
        // scopeKey: "@tgxn/test",
        // experienceId: "@tgxn/test",
        title: `Test ${categoryId}`,
        body: "Test Body",
        // data: { random: Math.random() },
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    console.log("Push sent", JSON.stringify(reply));
  };

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "space-around",
        padding: 2,
      }}
    >
      <Text>Your expo push token: {expoPushToken}</Text>
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <Text
          style={{
            marginBottom: 10,
            fontWeight: "bold",
          }}
        >
          Request
        </Text>
        {notification && (
          <Text style={{ marginBottom: 10 }}>
            {JSON.stringify(notification)}
          </Text>
        )}

        <Text
          style={{
            marginBottom: 10,
            fontWeight: "bold",
          }}
        >
          Response
        </Text>
        {notificationResponse && (
          <Text>REPLY: {JSON.stringify(notificationResponse.userText)}</Text>
        )}
        {notificationResponse && (
          <Text>{JSON.stringify(notificationResponse)}</Text>
        )}
      </View>
      <View>
        {[
          "submit_reply",
          "submit_reply_placeholder",
          "submit_reply_foreground",
          "submit_reply_foreground_placeholder",
        ].map((name) => (
          <View style={{ marginBottom: 5 }}>
            <Button
              title={`${name}`}
              onPress={async () => {
                setNotification(false);
                setNotificationResponse(false);
                await pushDirect(expoPushToken, name);
              }}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      alert("Failed to get push token for push notification!");
      return;
    }

    token = (await Notifications.getExpoPushTokenAsync()).data;
  } else {
    alert("Must use physical device for Push Notifications");
  }

  return token;
}
