import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Shape from "./Shape.js";
import Light from "./Light.js";
import Text from "./Text";
import Chat from "./Chat";
import AudioDetector from "./AudioDetector";
import * as dat from "dat.gui";

export default class App {
  constructor() {
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.gui = new dat.GUI();

    //inint chat
    this.chat = new Chat();
    this.chat.addEventListener("word", this.addWord.bind(this));
    this.chat.addEventListener("speechEnd", this.speechEnd.bind(this));
    this.chat.addEventListener(
      "gpt_response",
      this.getTotalSentence.bind(this)
    );
    //init audio detector
    this.audioDetector = new AudioDetector();
    this.audioDetector.addEventListener(
      "transcriptReady",
      this.onTextReceived.bind(this)
    );

    document.addEventListener("keydown", (e) => {
      if (e.key === " ") {
        console.log("space");
        this.audioDetector.stopRecording();
      }
    });

    this.splineLastPosition = 0;

    this.initTHREE();
  }

  async initTHREE() {
    // Create a scene
    this.scene = new THREE.Scene();
    // Create a camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    // Set camera position
    // this.camera.position.z = 0;
    this.camera.position.y = 1;
    // this.camera.lookAt(new THREE.Vector3(0, 5, 0));

    // Create a renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    // set shadow
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; //default
    document.body.appendChild(this.renderer.domElement);

    // Create controls
    // this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    // Create cube
    this.shape = new Shape(this.scene);
    // this.cube = this.shape.createCube();

    //Create Light
    this.light = new Light(this.scene);
    this.light.createLight();
    this.light.gui(this.gui);

    //create floor
    // this.shape.createFloor();

    //add helix
    this.curveObject = this.shape.createHelix();

    //Create text
    this.text = new Text(this.scene);
    this.font = await this.text.loadFont();

    this.allMots = [];

    document.addEventListener("keydown", (e) => {
      // this.chat.call(this.chat.context);
      // console.log("clicked");
      if (e.key === "Enter") {
        console.log("p");
        this.chat.call(this.chat.context);
      }
    });

    //
    this.draw();
  }

  getTotalSentence(sentence) {
    const words = sentence.split(" ");
    this.positionOnSpline = [];
    this.allTangents = [];
    this.allMots = [];
    let t = this.splineLastPosition;
    words.forEach((word, index) => {
      t += 0.004; //index / (words.length * 10);
      // t += this.splineLastPosition;
      // console.log("T TO BE CHECKED", t);
      const point = this.curveObject.getPointAt(t);

      //position sur la curve en fonction de t
      this.positionOnSpline.push(point);
      const fullTangent = this.curveObject.getTangentAt(t);
      let tangent = new THREE.Vector3(fullTangent.x, 0, fullTangent.z);
      tangent.normalize();

      this.allTangents.push(tangent);
    });
    // console.log("t", t.toFixed(3));
    this.splineLastPosition = parseFloat(t.toFixed(3)); // words.length / (words.length * 10);
    console.log("TTT", this.allTangents);
  }

  addWord(word) {
    // console.log(word);
    const text = this.text.createText(word, this.font);
    // console.log(text);
    this.allMots.push(text);
    const size = this.text.getSize();
    console.log(size);

    text.position.copy(this.positionOnSpline[this.allMots.length - 1]);
    text.lookAt(
      text.position.clone().add(this.allTangents[this.allMots.length - 1])
    );
    this.camera.lookAt(text.position);
    this.camera.position.y = text.position.y;
  }

  speechEnd(data) {
    this.chat.messages.push({
      role: "assistant",
      content: data.choices[0].message.content,
    });
    this.audioDetector.startRecording();
  }

  onTextReceived(transcript) {
    this.chat.call(transcript.text);
  }

  draw() {
    // this.controls.update();
    this.light.update();
    // this.allMots.forEach((mot) => {
    //   mot.update();
    // });
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.draw.bind(this));
  }
}
