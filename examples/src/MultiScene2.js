import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { storeObserver, StorePropType } from "./Store";
import * as MagicMove from "./magic-move";
import * as Animatable from "react-native-animatable";
import Bar from "./Bar";

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    flex: 1
  },
  content: {
    flex: 1,
    justifyContent: "center"
  },
  box: {
    alignSelf: "center",
    backgroundColor: "steelblue",
    width: 260,
    height: 260,
    borderRadius: 130,
    flexDirection: "column",
    justifyContent: "center"
  },
  title: {
    alignSelf: "center",
    textAlign: "center",
    color: "white",
    fontSize: 30
  },
  text: {
    color: "steelblue",
    margin: 24,
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 19,
    lineHeight: 24
  }
});

class Scene extends React.Component {
  static propTypes = {
    store: StorePropType
  };
  render() {
    const { debug } = this.props.store;
    return (
      <MagicMove.Scene style={styles.container}>
        <Bar hideId="scene8" debug={true} />
        <View style={styles.content}>
          <MagicMove.View
            id="scene8"
            style={styles.box}
            transition={MagicMove.Transition.squashAndStretch}
            debug={debug || true}
          >
            <Text style={styles.title}>Magic Move</Text>
          </MagicMove.View>
          <Animatable.Text
            style={styles.text}
            animation="fadeInUp"
            delay={400}
            duration={500}
          >
            Magically animate your component from one scene to another.
          </Animatable.Text>
        </View>
      </MagicMove.Scene>
    );
  }
}
export default storeObserver(Scene);
