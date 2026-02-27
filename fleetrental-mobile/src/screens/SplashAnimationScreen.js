import React, { useEffect, useRef } from 'react';
import {
    View, Text, Animated, Dimensions, StyleSheet, StatusBar, ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BMW_IMAGE = require('../../assets/splash.png');

const { width: W, height: H } = Dimensions.get('window');

export default function SplashAnimationScreen({ navigation }) {
    // Animations
    const carX          = useRef(new Animated.Value(-180)).current;
    const logoOpacity   = useRef(new Animated.Value(0)).current;
    const logoScale     = useRef(new Animated.Value(0.7)).current;
    const taglineOp     = useRef(new Animated.Value(0)).current;
    const taglineY      = useRef(new Animated.Value(12)).current;
    const roadLineX     = useRef(new Animated.Value(-W)).current;
    const screenOpacity = useRef(new Animated.Value(1)).current;
    const glowOpacity   = useRef(new Animated.Value(0)).current;
    const dotScale1     = useRef(new Animated.Value(0)).current;
    const dotScale2     = useRef(new Animated.Value(0)).current;
    const dotScale3     = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.sequence([

            // 1. Logo apparaît avec zoom + fade
            Animated.parallel([
                Animated.spring(logoScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
                Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
            ]),

            Animated.delay(200),

            // 2. Points de chargement apparaissent un par un
            Animated.stagger(120, [
                Animated.spring(dotScale1, { toValue: 1, friction: 5, useNativeDriver: true }),
                Animated.spring(dotScale2, { toValue: 1, friction: 5, useNativeDriver: true }),
                Animated.spring(dotScale3, { toValue: 1, friction: 5, useNativeDriver: true }),
            ]),

            Animated.delay(300),

            // 3. Lignes de route et halo apparaissent
            Animated.parallel([
                Animated.timing(roadLineX, { toValue: W * 2, duration: 800, useNativeDriver: true }),
                Animated.timing(glowOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
            ]),

            // 4. La voiture démarre depuis la gauche à grande vitesse
            Animated.timing(carX, {
                toValue: W + 200,
                duration: 900,
                useNativeDriver: true,
            }),

            // 5. Tagline apparaît
            Animated.parallel([
                Animated.timing(taglineOp, { toValue: 1, duration: 400, useNativeDriver: true }),
                Animated.timing(taglineY, { toValue: 0, duration: 400, useNativeDriver: true }),
            ]),

            Animated.delay(800),

            // 6. Écran disparaît
            Animated.timing(screenOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),

        ]).start(() => {
            navigation.replace('Home');
        });
    }, []);

    return (
        <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {/* Photo BMW en fond */}
            <ImageBackground source={BMW_IMAGE} style={styles.bgImage} resizeMode="cover">
                {/* Overlay sombre dégradé */}
                <View style={styles.overlay} />
            </ImageBackground>

            {/* Logo central */}
            <View style={styles.logoArea}>
                <Animated.View style={{
                    opacity: logoOpacity,
                    transform: [{ scale: logoScale }],
                    alignItems: 'center',
                }}>
                    {/* Icône */}
                    <View style={styles.iconCircle}>
                        <Ionicons name="car-sport" size={52} color="#fff" />
                    </View>

                    {/* Nom de l'app */}
                    <Text style={styles.logoText}>
                        Fleet<Text style={styles.logoAccent}>Rental</Text>
                    </Text>
                </Animated.View>

                {/* Points de chargement */}
                <View style={styles.dotsRow}>
                    {[dotScale1, dotScale2, dotScale3].map((dot, i) => (
                        <Animated.View key={i} style={[styles.dot, { transform: [{ scale: dot }] }]} />
                    ))}
                </View>
            </View>

            {/* Zone de route */}
            <View style={styles.roadArea}>
                {/* Halo de lumière des phares */}
                <Animated.View style={[styles.headlightGlow, { opacity: glowOpacity }]} />

                {/* Ligne centrale de route animée */}
                <Animated.View style={[styles.roadDash, { transform: [{ translateX: roadLineX }] }]}>
                    {[...Array(6)].map((_, i) => (
                        <View key={i} style={[styles.dashSegment, { left: i * 120 }]} />
                    ))}
                </Animated.View>

                {/* LA VOITURE */}
                <Animated.View style={[styles.carWrapper, { transform: [{ translateX: carX }] }]}>
                    {/* Trainée de vitesse */}
                    <View style={styles.speedTrail}>
                        {[...Array(4)].map((_, i) => (
                            <View key={i} style={[styles.trailLine, {
                                width: 60 - i * 12,
                                opacity: 0.3 - i * 0.06,
                                top: 24 + i * 6,
                            }]} />
                        ))}
                    </View>

                    {/* Corps de la voiture */}
                    <View style={styles.carBody}>
                        {/* Toit / cabine */}
                        <View style={styles.carRoof}>
                            <View style={styles.carWindow} />
                        </View>
                        {/* Châssis */}
                        <View style={styles.carChassis}>
                            <View style={styles.headlight} />
                            <View style={styles.grille} />
                        </View>
                        {/* Roues */}
                        <View style={styles.wheelsFront}>
                            <View style={styles.wheel}>
                                <View style={styles.wheelRim} />
                            </View>
                        </View>
                        <View style={styles.wheelsBack}>
                            <View style={styles.wheel}>
                                <View style={styles.wheelRim} />
                            </View>
                        </View>
                    </View>
                </Animated.View>

                {/* Sol de la route */}
                <View style={styles.road} />
            </View>

            {/* Tagline */}
            <Animated.Text style={[styles.tagline, { opacity: taglineOp, transform: [{ translateY: taglineY }] }]}>
                Location de véhicules simplifiée
            </Animated.Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1, backgroundColor: '#0f172a',
        alignItems: 'center', justifyContent: 'center',
    },

    // Photo de fond BMW
    bgImage: { ...StyleSheet.absoluteFillObject },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.72)',
    },

    // Zone logo
    logoArea: { alignItems: 'center', marginBottom: 40 },
    iconCircle: {
        width: 96, height: 96, borderRadius: 28,
        backgroundColor: '#1d4ed8',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
        shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8, shadowRadius: 20, elevation: 20,
    },
    logoText:   { fontSize: 38, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
    logoAccent: { color: '#60a5fa' },

    // Points
    dotsRow: { flexDirection: 'row', gap: 8, marginTop: 24 },
    dot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3b82f6' },

    // Zone route
    roadArea: {
        position: 'absolute', bottom: 100, left: 0, right: 0,
        height: 120, overflow: 'hidden',
    },
    road: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: 50, backgroundColor: '#1e293b',
        borderTopWidth: 2, borderTopColor: '#334155',
    },
    roadDash: { position: 'absolute', bottom: 22, left: 0, right: 0, height: 6, flexDirection: 'row' },
    dashSegment: { position: 'absolute', width: 60, height: 4, backgroundColor: '#f59e0b', borderRadius: 2 },

    // Halo phares
    headlightGlow: {
        position: 'absolute', bottom: 10, left: -100, right: -100,
        height: 80,
        backgroundColor: '#fde68a',
        opacity: 0.05,
        borderRadius: 40,
    },

    // Voiture
    carWrapper: { position: 'absolute', bottom: 48, left: 0 },
    speedTrail: { position: 'absolute', right: 140, top: 0, width: 80, height: 60 },
    trailLine:  { position: 'absolute', right: 0, height: 3, backgroundColor: '#60a5fa', borderRadius: 2 },

    carBody:   { width: 140, height: 60 },
    carRoof: {
        position: 'absolute', top: 0, left: 28, right: 20,
        height: 26, backgroundColor: '#1d4ed8', borderRadius: 8,
        borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
    },
    carWindow: {
        position: 'absolute', top: 4, left: 8, right: 8,
        height: 14, backgroundColor: '#93c5fd', borderRadius: 4, opacity: 0.7,
    },
    carChassis: {
        position: 'absolute', bottom: 12, left: 0, right: 0,
        height: 32, backgroundColor: '#2563eb', borderRadius: 6,
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8,
    },
    headlight: { width: 12, height: 8, backgroundColor: '#fde68a', borderRadius: 3, marginRight: 4 },
    grille:    { width: 16, height: 12, backgroundColor: '#1e40af', borderRadius: 2 },

    wheelsFront: { position: 'absolute', bottom: -1, right: 16 },
    wheelsBack:  { position: 'absolute', bottom: -1, left: 18 },
    wheel: {
        width: 26, height: 26, borderRadius: 13,
        backgroundColor: '#1e293b', borderWidth: 3, borderColor: '#475569',
        alignItems: 'center', justifyContent: 'center',
    },
    wheelRim: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#94a3b8' },

    // Tagline
    tagline: {
        position: 'absolute', bottom: 50,
        fontSize: 14, color: '#64748b', letterSpacing: 1.5,
        textTransform: 'uppercase', fontWeight: '600',
    },
});
