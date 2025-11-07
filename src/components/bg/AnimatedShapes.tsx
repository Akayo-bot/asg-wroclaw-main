

//export default function App();
export const AnimatedShapes = () =>{
  return (
    <div className="min-h-screen bg-[#e5e5e5] flex items-center justify-center p-8">
      <div className="relative w-[400px] h-[300px]">
        {/* Purple Rectangle Character */}
        <div className="absolute left-[113px] top-[40px] w-[120px] h-[252px] bg-[#6c2cff] rounded-sm">
          {/* Eyes */}
          <div className="absolute top-[20px] left-[50px] w-[10px] h-[10px] bg-white rounded-full">
            <div className="absolute top-[3px] left-[4px] w-[4px] h-[4px] bg-black rounded-full"></div>
          </div>
          <div className="absolute top-[20px] right-[20px] w-[10px] h-[10px] bg-white rounded-full">
            <div className="absolute top-[3px] left-[4px] w-[4px] h-[4px] bg-black rounded-full"></div>
          </div>
          {/* Nose/Mouth */}
          <div className="absolute top-[20px] left-[70px] w-[7px] h-[30px] bg-black rounded-none"></div>
        </div>

        {/* Black Rectangle Character */}
        <div className="absolute left-[198px] top-[115px] w-[75px] h-[177px] bg-black rounded-sm">
          {/* Eyes */}
          <div className="absolute top-[22px] left-[64px] w-[15px] h-[15px] bg-white rounded-full">
            <div className="absolute top-[4px] left-[5px] w-[7px] h-[7px] bg-black rounded-full"></div>
          </div>
          <div className="absolute top-[22px] right-[20px] w-[15px] h-[15px] bg-white rounded-full">
            <div className="absolute top-[4px] left-[5px] w-[7px] h-[7px] bg-black rounded-full"></div>
          </div>
        </div>

        {/* Orange Semi-circle Character */}
        <div className="absolute left-[65px] bottom-[8px] w-[165px] h-[90px] bg-[#ff8c52] rounded-t-full overflow-hidden">
          {/* Eyes */}
          <div className="absolute top-[40px] left-[80px] w-[10px] h-[10px] bg-black rounded-full"></div>
          <div className="absolute top-[40px] right-[38px] w-[10px] h-[10px] bg-black rounded-full"></div>
          {/* Mouth */}
          <div className="absolute top-[55px] left-[62.5%] -translate-x-1/2">
            <svg width="35" height="10" viewBox="0 0 40 20">
              <path d="M0 0 A20 20 0 0 0 40 0 Z" fill="black"/>
            </svg>
          </div>
        </div>

        {/* Yellow Rounded Rectangle Character */}
        <div className="absolute right-[65px] bottom-2 w-[85px] h-[130px] bg-[#ffd500] rounded-t-[70px]">
          {/* Eye */}
          <div className="absolute top-[28px] left-[32px] w-[7px] h-[7px] bg-black rounded-full"></div>
          {/* Mouth line */}
          <div className="absolute top-[43px] left-[53px] w-[50px] h-[5px] bg-black"></div>
        </div>
      </div>
    </div>
  );
}
