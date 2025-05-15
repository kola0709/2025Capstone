import React from "react";
import "../../css/MainPage.css";
import { Link, Element } from "react-scroll";
import Page1 from "./Page1";
import Page2 from "./Page2";
import Page3 from "./Page3";
import Page4 from "./Page4";
import one from "../../images/003.png";
import two from "../../images/004.png";
import three from "../../images/005.png";
import four from "../../images/006.png";

const MainPage = () => {
  return (
    <div>
      <div className="mainbox">

        <div className="marquee">
          <div className="marquee-content big-bold">
            <span>SIGN:AL SIGN:AL SIGN:AL SIGN:AL SIGN:AL SIGN:AL SIGN:AL SIGN:AL SIGN:AL SIGN:AL</span>
            <span>SIGN:AL SIGN:AL SIGN:AL SIGN:AL SIGN:AL SIGN:AL SIGN:AL SIGN:AL SIGN:AL SIGN:AL</span>
          </div>
        </div>
        
        <div className="marquee">
          <div className=""
        </div>
      </div>
    { /*
    <div className ="box">
      <div className ="wave -one"></div>
      <div className ="wave -two"></div>
      <div className ="wave -three"></div>
      <div className ="title">SIGN LANGUAGE</div>
    </div>
     */}
    <div>
      {/* 네비게이션 메뉴 */}
      <nav className="Mainpage_">
        <Link to="sectionOne" smooth={true} duration={1000}>
         <img src={one} width={"300px"} height={"170px"}/>
        </Link>
        <Link to="sectionTwo" smooth={true} duration={1000}>
        <img src={three} width={"300px"} height={"170px"}/>
        </Link>
        <Link to="sectionThree" smooth={true} duration={1000}>
        <img src={four} width={"300px"} height={"170px"}/>
        </Link>
        <Link to="sectionFour" smooth={true} duration={1000}>
        <img src={two} width={"300px"} height={"170px"}/>
        </Link>
      </nav>
      

      {/* 페이지 섹션 */}
      <Element name="sectionOne" className="h-screen flex items-center justify-center bg-red-300">
        <Page1 />
      </Element>
      <Element name="sectionTwo" className="h-screen flex items-center justify-center bg-blue-300">
        <Page2 />
      </Element>
      <Element name="sectionThree" className="h-screen flex items-center justify-center bg-green-300">
        <Page3 />
      </Element>
      <Element name="sectionFour" className="h-screen flex items-center justify-center bg-yellow-300">
        <Page4 />
      </Element>
    </div>
    </div>
  );
};

export default MainPage;
