Sure, here is the converted `App.js` with functional components:

```jsx
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Button,
  Text,
  Image,
  Alert,
  NativeEventEmitter,
  TouchableOpacity,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import FaceSDK, {
  Enum,
  FaceCaptureResponse,
  LivenessResponse,
  MatchFacesResponse,
  MatchFacesRequest,
  MatchFacesImage,
  MatchFacesSimilarityThresholdSplit,
  RNFaceApi,
  LivenessNotification,
  VideoEncoderCompletion,
} from '@regulaforensics/react-native-face-api';

const App = () => {
  const [img1, setImg1] = useState(require('./images/portrait.png'));
  const [img2, setImg2] = useState(require('./images/portrait.png'));
  const [similarity, setSimilarity] = useState('nil');
  const [liveness, setLiveness] = useState('nil');

  let image1 = new MatchFacesImage();
  let image2 = new MatchFacesImage();

  useEffect(() => {
    const eventManager = new NativeEventEmitter(RNFaceApi);

    const onCustomButtonTappedEvent = (event) => console.log(event);
    const videoEncoderCompletionEvent = (json) => {
      const completion = VideoEncoderCompletion.fromJson(JSON.parse(json))!;
      console.log('VideoEncoderCompletion:');
      console.log('    success: ' + completion.success);
      console.log('    transactionId: ' + completion.transactionId);
    };
    const livenessNotificationEvent = (json) => {
      const notification = LivenessNotification.fromJson(JSON.parse(json))!;
      console.log('LivenessProcessStatus: ' + notification.status);
    };

    eventManager.addListener('onCustomButtonTappedEvent', onCustomButtonTappedEvent);
    eventManager.addListener('videoEncoderCompletionEvent', videoEncoderCompletionEvent);
    eventManager.addListener('livenessNotificationEvent', livenessNotificationEvent);

    FaceSDK.init(
      (json) => {
        const response = JSON.parse(json);
        if (!response['success']) {
          console.log('Init failed: ');
          console.log(json);
        }
      },
      (_e) => {}
    );

    return () => {
      eventManager.removeListener('onCustomButtonTappedEvent', onCustomButtonTappedEvent);
      eventManager.removeListener('videoEncoderCompletionEvent', videoEncoderCompletionEvent);
      eventManager.removeListener('livenessNotificationEvent', livenessNotificationEvent);
    };
  }, []);

  const pickImage = (first) => {
    Alert.alert('Select option', '', [
      {
        text: 'Use gallery',
        onPress: () =>
          launchImageLibrary(
            {
              mediaType: 'photo',
              selectionLimit: 1,
              includeBase64: true,
            },
            (response) => {
              if (response.assets === undefined) return;
              setImage(first, response.assets[0].base64, Enum.ImageType.PRINTED);
            }
          ),
      },
      {
        text: 'Use camera',
        onPress: () =>
          FaceSDK.presentFaceCaptureActivity(
            (json) => {
              const response = FaceCaptureResponse.fromJson(JSON.parse(json))!;
              if (response.image != null && response.image.bitmap != null)
                setImage(first, response.image.bitmap, Enum.ImageType.LIVE);
            },
            (_e) => {}
          ),
      },
    ]);
  };

  const setImage = (first, base64, type) => {
    if (base64 == null) return;
    setSimilarity('null');
    if (first) {
      image1.bitmap = base64;
      image1.imageType = type;
      setImg1({ uri: 'data:image/png;base64,' + base64 });
      setLiveness('null');
    } else {
      image2.bitmap = base64;
      image2.imageType = type;
      setImg2({ uri: 'data:image/png;base64,' + base64 });
    }
  };

  const clearResults = () => {
    setImg1(require('./images/portrait.png'));
    setImg2(require('./images/portrait.png'));
    setSimilarity('null');
    setLiveness('null');
    image1 = new MatchFacesImage();
    image2 = new MatchFacesImage();
  };

  const matchFaces = () => {
    if (
      image1 == null ||
      image1.bitmap == null ||
      image1.bitmap === '' ||
      image2 == null ||
      image2.bitmap == null ||
      image2.bitmap === ''
    )
      return;
    setSimilarity('Processing...');
    const request = new MatchFacesRequest();
    request.images = [image1, image2];
    FaceSDK.matchFaces(
      JSON.stringify(request),
      (json) => {
        const response = MatchFacesResponse.fromJson(JSON.parse(json));
        FaceSDK.matchFacesSimilarityThresholdSplit(
          JSON.stringify(response!.results),
          0.75,
          (str) => {
            const split = MatchFacesSimilarityThresholdSplit.fromJson(JSON.parse(str))!;
            setSimilarity(
              split.matchedFaces!.length > 0
                ? ((split.matchedFaces![0].similarity! * 100).toFixed(2) + '%')
                : 'error'
            );
          },
          (e) => {
            setSimilarity(e);
          }
        );
      },
      (e) => {
        setSimilarity(e);
      }
    );
  };

  const liveness = () => {
    FaceSDK.startLiveness(
      (json) => {
        const response = LivenessResponse.fromJson(JSON.parse(json))!;
        if (response.bitmap != null) {
          setImage(true, response.bitmap, Enum.ImageType.LIVE);
          setLiveness(
            response['liveness'] === Enum.LivenessStatus.PASSED ? 'passed' : 'unknown'
          );
        }
      },
      (_e) => {}
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ padding: 15 }}>
        <TouchableOpacity onPress={() => pickImage(true)} style={{ alignItems: 'center' }}>
          <Image source={img1} resizeMode="contain" style={{ height: 150, width: 150 }} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => pickImage(false)} style={{ alignItems: 'center' }}>
          <Image source={img2} resizeMode="contain" style={{ height: 150, width: 200 }} />
        </TouchableOpacity>
      </View>

      <View style={{ width: '100%', alignItems: 'center' }}>
        <View style={{ padding: 3, width: '60%' }}>
          <Button title="Match" color="#4285F4" onPress={() => matchFaces()} />
        </View>
        <View style={{ padding: 3, width: '60%' }}>
          <Button title="Liveness" color="#4285F4" onPress={() => liveness()} />
        </View>
        <View style={{ padding: 3, width: '60%' }}>
          <Button title="Clear" color="#4285F4" onPress={() => clearResults()} />
        </View>
      </View>

      <View style={{ flexDirection: 'row', padding: 10 }}>
                <Text>Similarity: {similarity}</Text>
        <View style={{ padding: 10 }} />
        <Text>Liveness: {liveness}</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
    marginBottom: 12,
  },
});

export default App;
