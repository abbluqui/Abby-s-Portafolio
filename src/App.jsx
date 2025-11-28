import React, { useEffect, useRef, useState,useCallback } from "react";
import { Stage, Layer, Rect, Text, Group, Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import { Html } from "react-konva-utils";
import { motion, AnimatePresence, spring } from "framer-motion";


function ImageInKonva({ src, x = 0, y = 0, width = 400, height = 300, ...rest }) {

  const [image] = useImage(src);

  return <KonvaImage image={image} x={x} y={y} width={width} height={height} {...rest} />;

}


{/*calcular el tama;o de la pesta;a */}

const MAX_MEDIA_WIDTH = 350;

const PANEL_PADDING = 40;    
  

const calculatePanelDimensions = (originalWidth, originalHeight) => {

    let newMediaWidth;

    let newMediaHeight;

    if (originalWidth === 0 || originalHeight === 0) {

        originalWidth = 400;

        originalHeight = 300;

    }


    const aspectRatio = originalWidth / originalHeight;

    if (originalWidth > MAX_MEDIA_WIDTH) {

        newMediaWidth = MAX_MEDIA_WIDTH;

        newMediaHeight = newMediaWidth / aspectRatio;

    } else {

        newMediaWidth = originalWidth;

        newMediaHeight = originalHeight;

    }

    const newPanelWidth = newMediaWidth + PANEL_PADDING;

    const MIN_HEADER_SPACE = 120;

    const newPanelHeight = newMediaHeight + MIN_HEADER_SPACE ;



    return { width: newPanelWidth, height: newPanelHeight };

};



function useElementSize(elementRef) {

  const [size, setSize] = useState({ width: 0, height: 0 });


  useEffect(() => {

    const element = elementRef.current;

    if (!element) return;

    // Función para obtener las dimensiones

    const updateSize = () => {

      setSize({

        width: element.offsetWidth,

        height: element.offsetHeight,

      });

    }

    // Usar ResizeObserver para detectar cambios de tamaño (por el zoom)

    if (typeof ResizeObserver !== 'undefined') {

      const observer = new ResizeObserver(updateSize);

      observer.observe(element);

      updateSize(); // Medición inicial

      return () => observer.unobserve(element);

    } else {

  
      updateSize();

      window.addEventListener('resize', updateSize);

      return () => window.removeEventListener('resize', updateSize);

    }

  }, [elementRef]);

  return size;

}



function App() {

    const width = window.innerWidth;

    const height = window.innerHeight;



    const worldWidth = width * 2;

    const worldHeight = height * 2;



    const initialPos = {

      x: -(worldWidth / 2 - width / 2),

      y: -(worldHeight / 2 - height / 2),

    };

   



const [selectedFrame, setSelectedFrame] = useState(null);


const [floatOffsets, setFloatOffsets] = useState({});


const layerRef = useRef(null);


const stageRef = useRef(null)


{/* viniloooo */}
const [vinylRotation, setVinylRotation] = useState(0);
const [isPlaying, setIsPlaying] = useState(false);
const audioRef = useRef(null);

{/* girea si esta sonando */}
useEffect(() => {
  audioRef.current = new Audio("/audio/girlinred.mp3");
  audioRef.current.loop = true;
  
  return () => {
    if (audioRef.current){
      audioRef.current.pause();
    }
  }
}, []);

useEffect(() => {
  let anim;
  const audio= audioRef.current;

  if (isPlaying) {

    const playPromise = audio.play();

    if (playPromise!== undefined){
      playPromise.catch((err) =>{
        console.log("erroooor", err);
      });
    }

    
    anim = setInterval(() => {
      setVinylRotation(prev => prev + 1);
    }, 16);
  } else {

    if(audio){
      audio.pause();
    }
  }

  return () => clearInterval(anim);
}, [isPlaying]);








// posición del panel

    const [infoPosition, setInfoPosition] = useState({ x: 0, y: 0 });

   

//  tamaño constante de la pesta;a

    const [uiScale, setUiScale] = useState(1);



//  dimensiones  del panel

    const [infoDimensions, setInfoDimensions] = useState({ width: 400, height: 300 });



const infoPanelRef = useRef(null);

const panelSize = useElementSize(infoPanelRef);





{/*coordenada del centro en zoom y cosas asi */}

const getViewportCenterWorld = () => {

const stage = stageRef.current;

   if (!stage) return { x: 0, y: 0, scale: 1 };

    const stageX = stage.x();

    const stageY = stage.y();



    const scale = stage.scaleX();



    const centerX = width / 2;

    const centerY = height / 2;



    const worldX = (centerX - stageX) / scale;

    const worldY = (centerY - stageY) / scale;



return { x: worldX, y: worldY, scale };

};





{/*animacion de movimiento  */}

useEffect(() => {

const layer = layerRef.current;

  if (!layer) return;



// Guardar posiciones iniciales SOLO una vez

 if (Object.keys(floatOffsets).length === 0) {

  const initial = {};

    layer.find("Group").forEach((group, index) => {

    initial[index] = { x: group.x(), y: group.y() };

});

setFloatOffsets(initial);

return;}

const Konva = window.Konva;

const anim = new Konva.Animation((frame) => {

const time = frame.time;



layer.find("Group").forEach((group, index) => {

const base = floatOffsets[index];

  if (!base) return;

 

      const rect = group.getClientRect();

      const realWidth = rect.width;

      const angle = Math.sin(time/ 2000 + index) * 4;



group.offsetX(realWidth / 2);

group.offsetY(0);



group.x(base.x + realWidth / 2);

 group.y(base.y);



group.rotation(angle);

});

}, layer);



anim.start();

return () => anim.stop();

}, [floatOffsets]);





{/*handleWheel*/}



useEffect(() => {

const stage = stageRef.current;



const handleWheel = (e) => {

e.evt.preventDefault();

const stage= stageRef.current;



const scaleBy = 1.05;

 const oldScale = stage.scaleX();

const pointer = stage.getPointerPosition();



const mousePointTo = {

  x: (pointer.x - stage.x()) / oldScale,

  y: (pointer.y - stage.y()) / oldScale,

};



const minScale = 0.5;

const maxScale = 2;



const newScaleRaw =

  e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;



const newScale = Math.max(minScale, Math.min(maxScale, newScaleRaw));



stage.scale({ x: newScale, y: newScale });

setUiScale(1 / newScale);



stage.position({

  x: pointer.x - mousePointTo.x * newScale,

  y: pointer.y - mousePointTo.y * newScale,

});



const scale = stage.scaleX();

const dynamicPadding = 300 * scale;



const minX = -(worldWidth * scale - width) - dynamicPadding;

const maxX = dynamicPadding;



const minY = -(worldHeight * scale - height) - dynamicPadding;

const maxY = dynamicPadding;



const clampedX = Math.min(maxX, Math.max(minX, stage.x()));

const clampedY = Math.min(maxY, Math.max(minY, stage.y()));



stage.position({ x: clampedX, y: clampedY });



stage.batchDraw();

 

};





{/*zooooooom*/}



stage.on("wheel", handleWheel);

  return () => stage.off("wheel", handleWheel);

}, [worldWidth,worldHeight,width,height]);







useEffect(() => {

const stage = stageRef.current;



const handleDrag = () => {

const padding = 300;



const minX = -(worldWidth - width) - padding;

const maxX = padding;



const minY = -(worldHeight - height) - padding;

const maxY = padding;



const newX = Math.min(maxX, Math.max(minX, stage.x()));

const newY = Math.min(maxY, Math.max(minY, stage.y()));



stage.position({ x: newX, y: newY });





};



stage.on("dragmove", handleDrag);

return () => stage.off("dragmove", handleDrag);

}, [worldWidth, worldHeight, width, height]);





//   handleframeclick Manejo del Click y la Animación de Pulso

const handleFrameClick = (frameName) => {

  const group = layerRef.current.findOne(`[name='${frameName}']`);

if (!group) {

  setSelectedFrame(frameName);

return;}

 setInfoDimensions({ width: 400, height: 300 });

 setSelectedFrame(frameName);

};



//INFO DEL PANER DE INFO

const info = {

  "Dragon Fest": {

    text: "Una experiencia en realidad virtual programada por mí, aquí cada dinámica y activivad de la Universidad Carolina cobra vida. Cada detalle fue pensado para ofrecer una simulación inmersiva, educativa, bonita y divertida.",

    mediaType: "video",

    src: "/videos/dragon_fest.mp4",

  },

  "IVED": {

    text: "Un simulador odontológico desarrollado en Unity donde cada mesh se deforma en tiempo real al momento de que el usuario interactua con ciertos objetos . Todo el sistema de deformación y las interacciones fueron programadas por mí, combinando precisión técnica y diseño inmersivo para crear una experiencia educativa y práctica",

    mediaType: "video",

    src: "/videos/ived_video.mp4",

  },

  "DOLLHEAD": {

    text: "Una escultura 3D esculpida en ZBrush que representa la imperfección y la fragilidad en una cabeza de porcelana fina y perfecta pero oculto,  un rostro melancólico, mostrando las máscaras que usamos frente al mundo y lo que sentimos por dentro.",

    mediaType: "image",

    src: "/images/dollhead1.png",

  },

  "EYECLOWN": {

    text: "Payaso 3D diseñado en ZBrush, pensado para Halloween. Su rostro de cera carece de ojos completos, simbolizando la búsqueda de lo imposible y la imperfección. La pieza combina elementos lúdicos y perturbadores, mostrando cómo la vulnerabilidad puede coexistir con lo artístico y lo inquietante.",

    mediaType: "image",

    src: "/images/EyeClown.png",

  },

  "About me": {

    text: "Soy Abby Luques Garcia, estudiante de la Licenciatura en Creatividad Tecnológica, especializandome en programación front-end y back-end. Me encanta explorar nuevas habilidades y ver cómo mis ideas cobran vida en proyectos funcionales y creativos. Para mí, cada desafío creativo es una oportunidad de aprendizaje y crecimiento.",

    mediaType: "image",

    src: "/images/yo.JPG",

  },

   "Nave": {

    text: "Nave modelada en Blender. Este proyecto me permitió experimentar con la combinación de hard surface y formas orgánicas. Cada detalle, desde los cortes hasta las proporciones, fue un reto creativo que me ayudó a mejorar mi habilidad para equilibrar precisión técnica con estética visual. Un excelente ejercicio de práctica y exploración del modelado 3D.",

    mediaType: "image",

    src: "/images/Nave_4.png",

  },

  "Refri": {

    text: "Robot modelado en Blender. Me encantó experimentar con las formas y ver cómo poco a poco lograba que cada pieza fuera congruente con el concept original. Este proyecto me permitió mejorar mi control sobre la geometría y la coherencia visual del modelo.",

    mediaType: "image",

    src: "/images/refri_1.png",

  },

  "Porcelain Doll": {

    text: "Dibujo digital de una muñeca de porcelana. Su curiosidad la impulsa a explorar, pero su fragilidad la mantiene cautelosa. Esta obra refleja la tensión entre el deseo de descubrir y el miedo a romperse, mostrando delicadeza y vulnerabilidad en cada trazo.",

    mediaType: "image",

    src: "/images/Payaso1.png",

  },

  "Clown Tears": {

    text: "Este payaso que mira hacia el futuro con incertidumbre, preguntandose que pasará después. La ilustración revela miedo, dudas, cansancio...",

    mediaType: "image",

    src: "/images/Payaso2.png",

  },

  "Payaso 3": {

    text: "Ilustración de un payaso triste, agotado por la monotonía de su vida. Sus ojos y postura cuentan historias de experiencias que nunca vivió, atrapado en la rutina de su papel, y mostrando la tristeza que lleva consigo cada día.",

    mediaType: "image",

    src: "/images/Payaso3.png",

  },

  "Angel": {

    text: "Un ángel ilustrada en un momento de asombro, atrapada en un momento de sorpresa, capturando así su inocencia y maravilla ante algo que aun no comprende.",

    mediaType: "image",

    src: "/images/Angel.png",

  },

  "Landscape": {

    text: "Un paisaje de montañas que captura un momento de tranquilidad, cada detalle transmite paz con trazos sutiles, te puedes perder un rato pensando en la quietud que habría ahí. ",

    mediaType: "image",

    src: "/images/Landscape.png",

  },

  "Maruchan sopart": {

    text: "Soprart es un concurso de arte que hace Maruchan para visibilizar el talento mexicano. Me inspiré a crear una obra que pudiera conectar con la gente, al crear una situacion que muchos mexicanos han vivido. ",

    mediaType: "image",

    src: "/images/Sopart.png",

  },

  "Cocacolastic": {

    text: "Una práctica de anuncio dentro de After Effects para entender mejor las curvas de animación. fue un ejercicio divertido para entender los ritmos visuales, trancisiones y la fluidez.",

    mediaType: "video",

    src: "/videos/CocaCola.mp4",

  },

  "Mosaico": {

    text: "Un juego visual desarrollado en After Effects,aunque el proceso fue complicado, pues no sabia como crear los movimientos, pero luego, todo fluyó y pude hacer este efecto hipnótico.",

    mediaType: "video",

    src: "/videos/Moisaico.mp4",

  },

};




function hoverProps() {
  const Konva = window.Konva;
  return {
    onMouseOver: (e) => {
      e.target.to({
        scaleX: 1.06,
        scaleY: 1.06,
        duration: 0.15,
        easing: Konva.Easings.EaseOut,
      });
    },
    onMouseOut: (e) => {
      e.target.to({
        scaleX: 1,
        scaleY: 1,
        duration: 0.15,
        easing: Konva.Easings.EaseIn,
      });
    },
  };
}



//calcular las dimensiones de la pestaña

const DynamicMediaLoader = ({ frameName, info, setInfoDimensions }) => {

    const media = info[frameName];

    const videoRef = useRef(null);


    const getAndSetVideoDims = useCallback((videoElement) => {

        if (!videoElement) return;

        const realWidth = videoElement.videoWidth;

        const realHeight = videoElement.videoHeight;

        if (realWidth > 0 && realHeight > 0) {

            setDims(realWidth, realHeight);

        } else {

          setDims(400, 225);

        }

    }, [setInfoDimensions]);


const setDims = useCallback((width, height) => {

        const newDims = calculatePanelDimensions(width, height);

        setInfoDimensions(newDims);

    }, [setInfoDimensions]);


useEffect(() => {

  if (!media) return;

  const mediaFrame = info[frameName];

  if (!mediaFrame) return;


    {/* IMAGEN */}

if (mediaFrame.mediaType === "image") {

  const img = new Image();

  img.onload = () => {

  setDims(img.naturalWidth, img.naturalHeight);

};

    img.src = mediaFrame.src;

    return () => (img.onload = null);

  }


  if (media.mediaType === "video") {

    if (videoRef.current) {


      setDims(videoRef.current.videoWidth, videoRef.current.videoHeight);

    }

  }

}, [media]);


if (!media) return null;



return (

  <>

    <h2 style={{ marginTop: 0 }}>{frameName}</h2>

    <p style={{ fontSize: "14px", color: "#333" }}>{media.text}</p>

    {media.mediaType === "image" && (
    <img
      src={media.src}
      alt={frameName}
      
      style={{
        maxWidth: `${MAX_MEDIA_WIDTH}px`,
        height: "auto",

        display: "block",
        marginLeft:"auto",
        marginRight:"auto",

        borderRadius: "8px",
        marginTop: "10px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        objectFit: "contain",
    }}
   />
   )}







    {/* VIDEO */}

    {media.mediaType === "video" && (

  <div

    style={{

      width: "100%",

      display: "flex",

      justifyContent: "center",

      marginTop: "12px",

    }}

  >

    <video

      src={media.src}

      autoPlay

      loop

      muted

      controls

      style={{

        maxWidth: `${MAX_MEDIA_WIDTH}px`,

        width: "100%",

        height: "auto",

        borderRadius: "10px",

        background: "#000",

        objectFit: "contain",

        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",

      }}

    />

  </div>

)}
  </>

);

};



return (

<Stage width={width} height={height} ref={stageRef} draggable x={initialPos.x} y={initialPos.y}>

<Layer ref={layerRef}>

    {/*fondo*/}

    <Rect x={-worldWidth * 2} y={-worldHeight * 2} width={worldWidth * 5} height={worldHeight * 5} fill="#FFFAED"/>



    {/*marco 1*/}

    <Group x={1300} y={560} {...hoverProps("Abby's PORTFOLIO")}>

        <Rect width={550} height={330} fill="#D1D161" shadowColor="#2C2C34" shadowBlur={8}shadowOffsetY={4}/>

        <Text text="Abby's PORTFOLIO" x={10} y={30} fontSize={30} fill="#4965AF" fontFamily="Nanum Pen Script"/>
        <ImageInKonva src="/images/titulo.png" width={550} height={330} />

    </Group>



    {/*marco 2*/}

    <Group name="Dragon Fest" x={440} y={50} onClick={() => { const centerWorld = getViewportCenterWorld(); setInfoPosition(centerWorld); setUiScale(1 / centerWorld.scale); handleFrameClick("Dragon Fest"); }}  {...hoverProps("Dragon Fest")}>
        <Text text="Dragon Fest" x={10} y={55} fontSize={10} fill="#4965AF" fontFamily="Quicksand"/>
        <Rect width={320} height={460} fill="#CDDBF9" shadowColor="#2C2C34" shadowBlur={8}shadowOffsetY={4}/>
        <ImageInKonva src="/images/Poster_df.png" width={320} height={460} />

    </Group>



    {/*marco 3*/}

    <Group name="IVED" x={870} y={350} onClick={() => { const centerWorld = getViewportCenterWorld(); setInfoPosition(centerWorld); setUiScale(1 / centerWorld.scale); handleFrameClick("IVED") }} {...hoverProps("IVED")}>
        <Text text="IVED" x={10} y={55} fontSize={18} fill="#4965AF" fontFamily="Quicksand"/>
        <Rect width={280} height={180} fill="#CDDBF9" shadowColor="#2C2C34" shadowBlur={8} shadowOffsetY={4}/>
         <ImageInKonva src="/images/ived_frame.png" width={280} height={180} />

    </Group>



    {/*marco 4*/}

    <Group name="DOLLHEAD" x={2600} y={430} onClick={() => { const centerWorld = getViewportCenterWorld(); setInfoPosition({x:centerWorld.x-200, y:centerWorld.y-230}); setUiScale(1 / centerWorld.scale); handleFrameClick("DOLLHEAD") }}  {...hoverProps("DOLLHEAD")}>

      <Text text="DOLLHEAD" x={10} y={55} fontSize={10} fill="#4965AF" fontFamily="Quicksand"/>

        <Rect width={350} height={350} fill="#CDDBF9" shadowColor="#2C2C34" shadowBlur={8}shadowOffsetY={4}/>

        <ImageInKonva src="/images/Dollhead_frame.png" width={350} height={350} />

       

    </Group>



    {/*marco 5*/}

    <Group x={2480} y={940} onClick={() => { const centerWorld = getViewportCenterWorld(); setInfoPosition({x:centerWorld.x-200, y:centerWorld.y-230}); setUiScale(1 / centerWorld.scale); handleFrameClick("EYECLOWN") }}  {...hoverProps("EYECLOWN")}>

       <Text text="EYECLOWN" x={135} y={220} fontSize={20} fill="#4965AF" fontFamily="Quicksand"/>

        <Rect width={500} height={335} fill="#FFFAED" cornerRadius={20} shadowColor="#2C2C34" shadowBlur={8}shadowOffsetY={4}/>

         <ImageInKonva src="/images/Eyeclown_frame.png" width={510} height={335} />

       

    </Group>



      {/*marco 6*/}

    <Group x={880} y={30} onClick={() => { const centerWorld = getViewportCenterWorld(); setInfoPosition({x:centerWorld.x-200, y:centerWorld.y-230}); setUiScale(1 / centerWorld.scale); handleFrameClick("About me") }}  {...hoverProps("About me")}>
        <Text text="About me" x={10} y={55} fontSize={10} fill="#4965AF" fontFamily="Quicksand"/>
        <Rect width={250} height={250} fill="#CDDBF9" shadowColor="#2C2C34" shadowBlur={8}shadowOffsetY={4}/>
        <ImageInKonva src="/images/yo_frame.png" width={250} height={250} />

    </Group>



      {/*marco 7*/}

    <Group x={2000} y={430} onClick={() => { const centerWorld = getViewportCenterWorld(); setInfoPosition({x:centerWorld.x-200, y:centerWorld.y-230}); setUiScale(1 / centerWorld.scale); handleFrameClick("Nave") }}  {...hoverProps("Nave")}>

       <Text text="Nave" x={10} y={55} fontSize={10} fill="#4965AF" fontFamily="Quicksand"/>

        <Rect width={460} height={310} fill="#CDDBF9" shadowColor="#2C2C34" shadowBlur={8}shadowOffsetY={4}/>

        <ImageInKonva src="/images/Nave_frame.png" width={460} height={310} />

       

    </Group>



    {/*marco 8*/}

    <Group x={1500} y={85} onClick={() => { const centerWorld = getViewportCenterWorld(); setInfoPosition({x:centerWorld.x-200, y:centerWorld.y-230}); setUiScale(1 / centerWorld.scale); handleFrameClick("Refri") }}  {...hoverProps("Refri")} >

       <Text text="Refri" x={10} y={55} fontSize={10} fill="#4965AF" fontFamily="Quicksand"/>

        <Rect width={280} height={360} fill="#CDDBF9" shadowColor="#2C2C34" shadowBlur={8}shadowOffsetY={4}/>

         <ImageInKonva src="/images/refri_frame.png" width={280} height={360} />

       

    </Group>



    {/*marco 9*/}

    <Group x={2000} y={870} onClick={() => { const centerWorld = getViewportCenterWorld(); setInfoPosition({x:centerWorld.x-200, y:centerWorld.y-230}); setUiScale(1 / centerWorld.scale); handleFrameClick("Porcelain Doll") }}  {...hoverProps("Porcelain Doll")}>

      <Text text="Porcelain Doll" x={10} y={55} fontSize={10} fill="#4965AF" fontFamily="Quicksand"/>

        <Rect width={350} height={350} fill="#CDDBF9" shadowColor="#2C2C34" shadowBlur={8}shadowOffsetY={4}/>

        <ImageInKonva src="/images/PorcelainDoll_frame.png" width={350} height={350} />

       

    </Group>



    {/*marco 10*/}

    <Group x={1150} y={970} onClick={() => { const centerWorld = getViewportCenterWorld(); setInfoPosition({x:centerWorld.x-200, y:centerWorld.y-230}); setUiScale(1 / centerWorld.scale); handleFrameClick("Clown Tears") }}  {...hoverProps("Clown Tears")}>

       <Text text="Clown Tears" x={10} y={55} fontSize={10} fill="#4965AF" fontFamily="Quicksand"/>

        <Rect width={350} height={350} fill="#CDDBF9" shadowColor="#2C2C34" shadowBlur={8}shadowOffsetY={4}/>

        <ImageInKonva src="/images/SadClown_frame.png" width={350} height={350} />

       

    </Group>



     {/*marco 10*/}

    <Group x={1570} y={970} onClick={() => { const centerWorld = getViewportCenterWorld(); setInfoPosition({x:centerWorld.x-200, y:centerWorld.y-230}); setUiScale(1 / centerWorld.scale); handleFrameClick("Payaso 3") }}  {...hoverProps("Payaso 3")}>

        <Rect width={350} height={350} fill="#CDDBF9" shadowColor="#2C2C34" shadowBlur={8}shadowOffsetY={4}/>

        <ImageInKonva src="/images/PelonClown_frame.png" width={350} height={350} />

        <Text text="Payaso 3" x={10} y={55} fontSize={10} fill="#4965AF" fontFamily="Quicksand"/>

    </Group>



    {/*marco 11*/}

    <Group x={700} y={950} onClick={() => { const centerWorld = getViewportCenterWorld(); setInfoPosition({x:centerWorld.x-200, y:centerWorld.y-230}); setUiScale(1 / centerWorld.scale); handleFrameClick("Angel") }}  {...hoverProps("Angel")}>

      <Text text="Angel" x={10} y={55} fontSize={10} fill="#4965AF" fontFamily="Quicksand"/>

        <Rect width={350} height={350} fill="#CDDBF9" shadowColor="#2C2C34" shadowBlur={8}shadowOffsetY={4}/>

        <ImageInKonva src="/images/angel_frame.png" width={350} height={350} />

       

    </Group>



     {/*marco 12*/}

    <Group x={90} y={1000} onClick={() => { const centerWorld = getViewportCenterWorld(); setInfoPosition({x:centerWorld.x-200, y:centerWorld.y-230}); setUiScale(1 / centerWorld.scale); handleFrameClick("Landscape") }}  {...hoverProps("Landscape")}>

       <Text text="Landscape" x={10} y={55} fontSize={10} fill="#4965AF" fontFamily="Quicksand"/>

        <Rect width={530} height={360} fill="#CDDBF9" shadowColor="#2C2C34" shadowBlur={8}shadowOffsetY={4}/>

        <ImageInKonva src="/images/Landscape_frame.png" width={530} height={360} />

       

    </Group>



       {/*marco 13*/}

    <Group x={70} y={600} onClick={() => { const centerWorld = getViewportCenterWorld(); setInfoPosition({x:centerWorld.x-200, y:centerWorld.y-230}); setUiScale(1 / centerWorld.scale); handleFrameClick("Maruchan sopart") }}  {...hoverProps("Maruchan sopart")}>

      <Text text="Maruchan sopart" x={10} y={55} fontSize={10} fill="#4965AF" fontFamily="Quicksand"/>

        <Rect width={530} height={360} fill="#CDDBF9" shadowColor="#2C2C34" shadowBlur={8}shadowOffsetY={4}/>

        <ImageInKonva src="/images/Maruchan_frame.png" width={530} height={360} />

       

    </Group>



     {/*marco 14*/}

    <Group x={100} y={0} onClick={() => { const centerWorld = getViewportCenterWorld(); setInfoPosition({x:centerWorld.x-200, y:centerWorld.y-230}); setUiScale(1 / centerWorld.scale); handleFrameClick("Cocacolastic") }}  {...hoverProps("Cocacolastic")}>
        <Text text="Cocacolastic" x={10} y={55} fontSize={10} fill="#4965AF" fontFamily="Quicksand"/>
        <Rect width={250} height={350} fill="#CDDBF9" shadowColor="#2C2C34" shadowBlur={8}shadowOffsetY={4}/>
         <ImageInKonva src="/images/cocacola_frame.png" width={250} height={350} />

       

    </Group>



     {/*marco 15*/}

    <Group x={100} y={380} onClick={() => { const centerWorld = getViewportCenterWorld(); setInfoPosition({x:centerWorld.x-200, y:centerWorld.y-230}); setUiScale(1 / centerWorld.scale); handleFrameClick("Mosaico") }}  {...hoverProps("Mosaico")}>

        <Rect width={250} height={160} fill="#CDDBF9" shadowColor="#2C2C34" shadowBlur={8}shadowOffsetY={4}/>

        <Text text="Mosaico" x={10} y={55} fontSize={10} fill="#4965AF" fontFamily="Quicksand"/>
        <ImageInKonva src="/images/mosaico.png" width={250} height={160} />    
    </Group>



    {/*marco 16*/}

    <Group x={1210} y={350} >   
        <Text text="Tuto" x={10} y={55} fontSize={10} fill="#4965AF" fontFamily="Quicksand"/>
        <Rect width={150} height={150} fill="#CDDBF9" shadowColor="#2C2C34" shadowBlur={8}shadowOffsetY={4}/>
        <ImageInKonva src="/images/tuto.png" width={150} height={150} />
    </Group>



   







    {/*flores 2*/}

    <Group x={1210} y={0}>
        <ImageInKonva src="/images/ramo.png" width={200} height={310} />

    </Group>







{/*pestaña de info*/}

<AnimatePresence>

  {selectedFrame && info[selectedFrame] && (

    <Html>

      <motion.div

        key={selectedFrame}

        initial={{ opacity: 0, scale: 0.9 }}

        animate={{ opacity: 1, scale: uiScale }}

        exit={{ opacity: 0, scale: 0.8}}

        transition={{ duration: 0.35, type: "spring", stiffness:120 }}

        style={{

          position: "absolute",

          top: `${infoPosition.y}px`,

          left: `${infoPosition.x}px`,

          transform: "translate(-50%, -50%)",

         

          width: `${infoDimensions.width}px`,

          //height: `${infoDimensions.height}px`,



          background: "#ffedeaed",

          borderRadius: "10px",

          boxShadow: "0 4px 12px rgba(0,0,0,0.25)",

          padding: `${20 / uiScale}px`,



          fontFamily: "Quicksand",

          color: "#2C2C34",

          zIndex: 10,

          transformOrigin: "center center",

          //overflow: "hidden",

        }}

      >

        <div

          style={{

            position: "absolute",

            inset: 0,

            background: "#ffedeaed",

            borderRadius: "16px",

            zIndex: -1,

          }}

        />



        <DynamicMediaLoader

            frameName={selectedFrame}

            info={info}

            setInfoDimensions={setInfoDimensions}

        />

        {/* Botón cerrar */}

        <button

          onClick={() => setSelectedFrame(null)}

          style={{

            position: "absolute",

            top: `${10 / uiScale}px`,

            right: `${10 / uiScale}px`,

            background: "#FFDE94",

            border: "none",

            borderRadius: "5px",

            color: "#4965AF",

            fontSize: `${16 / uiScale}px`,

            cursor: "pointer",

            padding: `${4 / uiScale}px ${8 / uiScale}px`,

          }}

        >

          ✕

        </button>

      </motion.div>

    </Html>

  )}

</AnimatePresence>
</Layer>


<Layer>
  
    {/*decoracion 3*/}

<Group x={860} y={750} onClick={() => setIsPlaying(prev => !prev)}{...hoverProps("VINILO")}>
 
  <Text 
    text="VINILO"
    x={10}
    y={55}
    fontSize={10}
    fill="#4965AF"
    fontFamily="Quicksand"
  />
 <ImageInKonva 
    src="/images/vinilo.png" 
    width={310} 
    height={310} 
    rotation={vinylRotation}
    offsetX={155}  // centro de la imagen para girar bien
    offsetY={155}
  />
    
    
</Group>

<Group x={1080} y={670}>
   <ImageInKonva src="/images/notita.png" width={200} height={130} offsetX={110} offsetY={110} />

</Group>

<Group x={1080} y={750}>
   <ImageInKonva src="/images/libi.png" width={110} height={150} />

</Group>

<Group x={1815} y={370}>
   <ImageInKonva src="/images/gaara.png" width={110} height={150} />

</Group>
  
</Layer>


{/*estaticos*/}

<Layer>



    {/*Cuadro1*/}

    <Group x={1940} y={50}  {...hoverProps("IG")}>

      <Text text="IG" x={10} y={10} fontSize={18} fill="#4965AF" fontFamily="Quicksand"/>
      <ImageInKonva src="/images/ig.png" width={180} height={180}
      onClick={() => window.open("https://www.instagram.com/abbluqui/")}
      /> 


       

    </Group>



     {/*Cuadro 2*/}

    <Group x={2160} y={50}  {...hoverProps("Gmail")}>

      <Text text="Gmail" x={10} y={10} fontSize={10} fill="#4965AF" fontFamily="Quicksand"/>
      <ImageInKonva src="/images/gmail.png" width={180} height={180} 
        onClick={() => (window.location.href = "mailto:tu-abbyluques1@gmail.com")} />

       

    </Group>



     {/*Cuadro 3*/}

    <Group x={2380} y={50}  {...hoverProps("LinkedIn")}>

      <Text text="LinkedIn" x={10} y={10} fontSize={10} fill="#4965AF" fontFamily="Quicksand"/>

        <ImageInKonva src="/images/linkin.png" width={180} height={180} 
          onClick={() => window.open("https://www.linkedin.com/in/abby-luques-086b89326?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app", "_blank")} />

       

    </Group>



     {/*decoracion 4*/}

    <Group x={2570} y={0}>
       
        <ImageInKonva src="/images/florero.png" width={150} height={240} />

    </Group>



     {/*decoracion 5*/}

    <Group x={2660} y={100}>

      <Text text="Holi" x={55} y={7} fontSize={12} fill="#4965AF" fontFamily="Nanum pen script"/>

         <ImageInKonva src="/images/tiquito.png" width={130} height={130} />

    </Group>



    {/*estante 1*/}

    <Group x={1880} y={220}>

        <Text text="estante" x={10} y={5} fontSize={10} fill="#4965AF" fontFamily="Quicksand"/>
         <ImageInKonva src="/images/estante.png" width={1000} height={175} />

    </Group>



</Layer>

</Stage>





);

}



export default App;