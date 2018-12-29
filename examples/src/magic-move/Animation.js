/* globals Promise */
import React from "react";
import { Animated, View, StyleSheet } from "react-native";
import PropTypes from "prop-types";

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0
  }
});

function measureLayout(ref) {
  return new Promise(resolve => {
    function onMeasure(x, y, width, height, pageX, pageY) {
      if (width || height || pageX || pageY) {
        return resolve({
          x: pageX,
          y: pageY,
          width,
          height
        });
      }
      requestAnimationFrame(() => {
        ref.measure(onMeasure);
      });
    }
    ref.measure(onMeasure);
  });
}

const ANIMATABLE_PROPS = {
  // View
  borderRightColor: "transparent",
  borderBottomColor: "transparent",
  borderBottomEndRadius: 0,
  borderBottomLeftRadius: 0,
  borderBottomRightRadius: 0,
  borderBottomStartRadius: 0,
  borderBottomWidth: 0,
  borderColor: "transparent",
  borderEndColor: "transparent",
  borderLeftColor: "transparent",
  borderLeftWidth: 0,
  borderRadius: 0,
  backgroundColor: "transparent",
  borderRightWidth: 0,
  borderStartColor: "transparent",
  borderStyle: undefined,
  borderTopColor: "transparent",
  borderTopEndRadius: 0,
  borderTopLeftRadius: 0,
  borderTopRightRadius: 0,
  borderTopStartRadius: 0,
  borderTopWidth: 0,
  borderWidth: 0,
  opacity: 1,
  elevation: 0,
  // Text,
  fontSize: undefined,
  color: "black"
};

/**
 * 1. Hide to component
 * 2. Get layout to and from component
 * 3. Render MagicMove component
 * 4. Hide from component
 * 5. Animate...
 * 6. Show to component
 * 7. Remove MagicMove component
 */
class MagicMoveAnimation extends React.Component {
  static propTypes = {
    from: PropTypes.object.isRequired,
    to: PropTypes.object.isRequired,
    onCompleted: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      animValue: new Animated.Value(0),
      container: undefined,
      from: undefined,
      to: undefined
    };

    //
    // 1. Hide real to component
    //
    props.to.setOpacity(0);
  }

  componentDidMount() {
    //
    // 2. Get layout for from and to position
    //
    const { to, from } = this.props;
    Promise.all([
      measureLayout(this._ref),
      measureLayout(to.getRef()),
      measureLayout(to.getSceneRef() || this._ref),
      measureLayout(from.getRef()),
      measureLayout(from.getSceneRef() || this._ref)
    ]).then(layouts => {
      const newState = {
        container: layouts[0],
        to: {
          ...to.getStyle(),
          ...layouts[1],
          scene: layouts[2]
        },
        from: {
          ...from.getStyle(),
          ...layouts[3],
          scene: layouts[4]
        }
      };
      // console.log("NEW STATE: ", newState);
      this.setState(newState);
    });
  }

  interpolate(from, to) {
    return this.state.animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [from, to]
    });
  }

  render() {
    const { container, to, from } = this.state;
    let content;
    let debugContent;

    //
    // 3. Render MagicMove component
    //
    if (container && to && from) {
      const a = {
        width: to.width,
        height: to.height,
        from: {
          x: from.x - container.x - (to.width - from.width) / 2,
          y: from.y - container.y - (to.height - from.height) / 2,
          scaleX: from.width / to.width,
          scaleY: from.height / to.height
        },
        to: {
          x: to.x - to.scene.x + from.scene.x - container.x,
          y: to.y - to.scene.y + from.scene.y - container.y,
          scaleX: 1,
          scaleY: 1
        }
      };
      const style = {
        position: "absolute",
        width: a.width,
        height: a.height,
        left: 0,
        top: 0,
        transform: [
          { translateX: this.interpolate(a.from.x, a.to.x) },
          { translateY: this.interpolate(a.from.y, a.to.y) },
          { scaleX: this.interpolate(a.from.scaleX, a.to.scaleX) },
          { scaleY: this.interpolate(a.from.scaleY, a.to.scaleY) }
        ]
      };
      Object.keys(ANIMATABLE_PROPS).forEach(propName => {
        let toProp = to[propName];
        let fromProp = from[propName];
        if (toProp === undefined && fromProp === undefined) return;
        let defaultValue = ANIMATABLE_PROPS[propName];
        defaultValue =
          defaultValue === undefined ? toProp || fromProp : defaultValue;
        toProp = toProp === undefined ? defaultValue : toProp;
        fromProp = fromProp === undefined ? defaultValue : fromProp;
        style[propName] =
          toProp === fromProp ? toProp : this.interpolate(fromProp, toProp);
      });

      const {
        children,
        debug,
        id,
        AnimatedComponent,
        ...otherProps
      } = this.props.to.props;
      delete otherProps.style;
      delete otherProps.Component;
      delete otherProps.useNativeDriver;
      delete otherProps.keepHidden;
      delete otherProps.duration;
      delete otherProps.easing;
      if (debug) {
        style.opacity = 0.8;
        console.debug('MagicMove animation "', id, '": ', a); //eslint-disable-line
        debugContent = [
          <Animated.View
            key="debugFrom"
            style={{
              position: "absolute",
              width: from.width,
              height: from.height,
              left: from.x - container.x,
              top: from.y - container.y,
              backgroundColor: "blue",
              borderColor: "darkblue",
              borderWidth: 1,
              borderRadius: from.borderRadius || 0,
              opacity: 0.5
            }}
          />,
          <Animated.View
            key="debugTo"
            style={{
              position: "absolute",
              width: to.width,
              height: to.height,
              left: a.to.x,
              top: a.to.y,
              backgroundColor: "green",
              borderColor: "darkgreen",
              borderWidth: 1,
              borderRadius: to.borderRadius || 0,
              opacity: 0.5
            }}
          />
        ];
      }
      content = (
        <AnimatedComponent style={style} {...otherProps}>
          {children}
        </AnimatedComponent>
      );
    }
    return (
      <View ref={this._setRef} style={styles.container} pointerEvents="none">
        {debugContent}
        {content}
      </View>
    );
  }

  _setRef = ref => {
    this._ref = ref;
  };

  componentDidUpdate() {
    const { animValue, container, to, from } = this.state;
    if (container && to && from) {
      //
      // 4. Hide from component
      //
      this.props.from.setOpacity(0);

      //
      // 5. Animate...
      //
      const fromProps = this.props.from.props;
      const toProps = this.props.to.props;
      Animated.timing(animValue, {
        toValue: 1,
        duration: toProps.debug ? 8000 : toProps.duration,
        delay: toProps.delay,
        easing: toProps.easing,
        useNativeDriver: toProps.useNativeDriver && fromProps.useNativeDriver
      }).start(() => {
        const { to, from, onCompleted } = this.props;
        to.setOpacity(1);
        if (!from.props.keepHidden) {
          from.setOpacity(1);
        }
        onCompleted();
      });
    }
  }
}

export default MagicMoveAnimation;