// Subpath entry: @titan-design/react-ui/motion/camera
//
// The camera layer alone. `./motion` also carries Beat, MotionProvider and EvidenceChip, which
// import react and react-native; this entry reaches only the pure `camera.ts` and `easing.ts`, so
// a node CLI can import it. `motion-camera.test.ts` fails when that stops being true.
export {
  camera,
  CAMERA_MOTION,
  fitBox,
  project,
  unproject,
  type Box,
  type CameraFrame,
  type CameraOptions,
  type CameraStation,
  type Point,
  type Viewport,
} from './components/ui/motion/camera'
