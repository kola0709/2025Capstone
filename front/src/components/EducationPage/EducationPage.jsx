import React, { useEffect, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react"; // Navigation 모듈 없이 그냥 Swiper만 임포트
import "swiper/css";
import "../../css/Education.css";

export default function SwiperCard() {
  const swiperRef = useRef(null);
  const [swiperList, setSwiperList] = useState([]);
  const [searchQuery, setSearchQuery] = useState(""); // 검색어 상태 추가
  const [filteredTableData, setFilteredTableData] = useState([]);
  const [topic, setTopic] = useState(null); // 주제 선택 상태

  // 검색 처리
  const handleSearch = () => {
    if (searchQuery.trim() === "") return;
  
    fetch(`http://localhost:8080/api/education/search?name=${searchQuery}`)
      .then((res) => res.json())
      .then((data) => {
        console.log(data); 
        setFilteredTableData(data); // 바로 세팅 가능
      })
      .catch((error) => console.error("Search error:", error));
  };
  

  // 토픽 클릭 시 해당 토픽으로 데이터 필터링
  const handleTopic = (topic) => {
    setTopic(topic);
  
    fetch(`http://localhost:8080/api/education/category?category=${topic}`)
      .then((res) => res.json())
      .then((data) => {
        setFilteredTableData(data);
      })
      .catch((error) => console.error("Category filter error:", error));
  };
  

   // 카드 클릭 시 테이블 내용 업데이트
   const handleCardClick = (data) => {
    setFilteredTableData([data]); // 기존 데이터를 덮어쓰고 클릭한 데이터만 표시
  };

  useEffect(() => {
    fetch("http://localhost:8080/api/education")
      .then((res) => res.json())
      .then((data) => {
        setSwiperList(data); // 기존 data.data가 아닌 data
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  return (
    <div className="Edu_Main">
      {/* 검색창 */}
      <div className="Edu_Content">
        <input
          className="searchbar"
          type="text"
          placeholder="검색어를 입력하시오"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)} // 검색어 입력을 상태로 관리
        />
        <button className="search-but" onClick={handleSearch}>
          🔍
        </button>
      </div>

      <div className="Edu_TableChart">
        <table className="chart" style={{ width: "80%", border: "1px solid black", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th onClick={() => handleTopic("fruct")}>과일</th>
              <th onClick={() => handleTopic("animal")}>동물</th>
              <th onClick={() => handleTopic("hello")}>인사</th>
              <th onClick={() => handleTopic("color")}>색깔</th>
              <th onClick={() => handleTopic("plecd")}>물건</th>
            </tr>
          </thead>
        </table>
      </div>

      {/* 필터링된 테이블 출력 */}
      {filteredTableData.length > 0 && (
        <div className="Edu_TableChart">
          <table className="chart" style={{ width: "80%", border: "1px solid black", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>이름</th>
                <th>이미지</th>
              </tr>
            </thead>
            <tbody>
              {filteredTableData.map((data, idx) => (
                <tr key={idx}>
                  <td>{data.name}</td>
                  <td style={{display: "flex", flexdirection: "column"}}>
                    <img src={data.imageUrl} alt={data.name} style={{ width: "150px", display: "block", margin: "auto" }} />
                    <video src={data.videoUrl} style={{ width: "300px", display: "block", margin: "auto" }} controls />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
     
      <div className="swiper-container">
        {/* Swiper 인스턴스가 제대로 생성되었을 때만 Prev/Next 버튼 활성화 */}
        {swiperList && swiperList.length > 0 ? (
          <>
            <button className="prev-btn" onClick={() => swiperRef.current?.slidePrev()}>
              Prev
            </button>

            <Swiper
              onBeforeInit={(swiper) => {
                swiperRef.current = swiper; // Swiper 인스턴스 할당
              }}
              slidesPerView={1}
              breakpoints={{
                800: { slidesPerView: 1 },
                1200: { slidesPerView: 2 },
                1600: { slidesPerView: 3 },
                1920: { slidesPerView: 4 },
              }}
              navigation // 자동으로 내장된 Navigation 모듈 사용
            >
              {swiperList.map((data, idx) => (
                <SwiperSlide key={idx}>
                  <div className="card-wrap" onClick={() => handleCardClick(data)}>
                  <img src={data.imageUrl} alt={data.displayName} style={{ width: "150px", display: "block", margin: "auto" }} />
                  <video src={data.videoUrl} controls />
                  <p>{data.name}</p>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            <button className="next-btn" onClick={() => swiperRef.current?.slideNext()}>
              Next
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
