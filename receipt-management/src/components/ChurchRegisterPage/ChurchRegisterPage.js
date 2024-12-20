import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TextField, MenuItem, Button, Typography, Paper } from "@mui/material";

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://awanaevent.com"
    : "http://localhost:8080";

const eventMapping = [
  { code: "YS", name: "영성수련회" },
  { code: "BQF", name: "성경퀴즈대회 설명회" },
  { code: "BQ", name: "성경퀴즈대회" },
  { code: "YMS", name: "YM Summit" },
  { code: "AMC", name: "컨퍼런스" },
  { code: "BT1", name: "상반기 비티" },
  { code: "BT2", name: "하반기 비티" },
  { code: "BT", name: "수시비티" },
  { code: "OLF", name: "올림픽 설명회" },
  { code: "OL", name: "올림픽" },
  { code: "TC", name: "티앤티 캠프" },
  { code: "DC", name: "감독관학교" },
  { code: "CC1", name: "조정관학교 101" },
  { code: "CC2", name: "조정관학교 201" },
  { code: "NR", name: "신규등록" },
  { code: "RR", name: "재등록" },
  { code: "ETC", name: "기타이벤트" },
];

const ChurchRegisterPage = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [churchNumber, setChurchNumber] = useState("");
  const [pinNumber, setPinNumber] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(`${BASE_URL}/admin/events`);
        if (!response.ok) {
          throw new Error("Failed to fetch events");
        }
        const data = await response.json();
        // 활성화된(공개) 이벤트만 필터링
        const publicEvents = data.filter((event) => event.is_public);
        setEvents(publicEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    fetchEvents();
  }, []);

  const handleCheckNavigation = async () => {
    if (!selectedEvent) {
      alert("이벤트를 선택해주세요.");
      return;
    }
    if (!churchNumber || churchNumber.length !== 3) {
      alert("3자리 교회등록번호를 입력해주세요.");
      return;
    }
    if (!pinNumber || pinNumber.length !== 8) {
      alert("핸드폰 뒤 8자리를 입력해주세요.");
      return;
    }

    // 이벤트 코드와 연도를 찾기
    const eventDetails = events.find(
      (event) => event.event_name === selectedEvent
    );
    const eventCode = eventMapping.find(
      (mapping) => mapping.code === selectedEvent
    )?.code;
    const eventYear = eventDetails?.event_year;

    if (!eventCode || !eventYear) {
      alert("이벤트 정보를 확인할 수 없습니다.");
      return;
    }

    // 테이블명 생성
    const fullPin = churchNumber + pinNumber; // 3자리 교회번호 + 8자리 핀번호
    const tableName = `${eventCode}_${eventYear}_${churchNumber}_${pinNumber}`;

    try {
      // 백엔드에 테이블 확인 요청
      const response = await fetch(`${BASE_URL}/register/check-table`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableName }),
      });

      if (!response.ok) {
        throw new Error("Failed to check the table.");
      }

      const data = await response.json();

      if (data.status === "table_exists") {
        navigate(`/check`, { state: { tableName } });
      } else if (data.status === "table_created") {
        alert("해당 교회의 신청 정보가 없습니다. 확인 후 다시 시도해주세요.");
      }
    } catch (error) {
      console.error("Error checking table:", error.message);
      alert("테이블 확인 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  const handleEventSelection = async () => {
    if (!selectedEvent) {
      alert("이벤트를 선택해주세요.");
      return;
    }
    if (!churchNumber || churchNumber.length !== 3) {
      alert("3자리 교회등록번호를 입력해주세요.");
      return;
    }
    if (!pinNumber || pinNumber.length !== 8) {
      alert("핸드폰 뒤 8자리를 입력해주세요.");
      return;
    }

    // 이벤트 코드와 연도를 찾기
    const eventDetails = events.find(
      (event) => event.event_name === selectedEvent
    );
    const eventCode = eventMapping.find(
      (mapping) => mapping.code === selectedEvent
    )?.code;
    const eventYear = eventDetails?.event_year;

    if (!eventCode || !eventYear) {
      alert("이벤트 정보를 확인할 수 없습니다.");
      return;
    }

    // 테이블명 생성
    const fullPin = churchNumber + pinNumber; // 3자리 교회번호 + 8자리 핀번호
    const tableName = `${eventCode}_${eventYear}_${churchNumber}_${pinNumber}`;

    try {
      // 백엔드에 테이블 확인 및 생성 요청
      const response = await fetch(`${BASE_URL}/register/check-table`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableName }),
      });

      if (!response.ok) {
        throw new Error("Failed to check or create the table.");
      }

      const data = await response.json();
      if (data.status === "table_created") {
        alert("참가신청 페이지로 이동합니다.");
      } else if (data.status === "table_exists") {
        alert("입력이 완료되어있습니다. 수정 또는 확인하시겠습니까?");
      }

      // EventFormRouter로 이동
      navigate(`/register/${selectedEvent}`, { state: { fullPin, tableName } });
    } catch (error) {
      console.error("Error handling event selection:", error);
      alert("테이블 생성 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  const handleChurchNumberChange = (e) => {
    const value = e.target.value;
    if (/^\d{0,3}$/.test(value)) {
      // 숫자만 허용하고 최대 3자리까지 제한
      setChurchNumber(value);
    }
  };

  const handlePinChange = (e) => {
    const value = e.target.value;
    if (/^\d{0,8}$/.test(value)) {
      // 숫자만 허용하고 최대 8자리까지 제한
      setPinNumber(value);
    }
  };

  return (
    <div style={styles.container}>
      <Typography variant="h4" style={{ marginBottom: "20px" }}>
        이벤트 참가 신청
      </Typography>
      <Typography style={{ marginBottom: "40px", textAlign: "center" }}>
        참가 신청하려는 이벤트를 선택 후 내용을 입력해주세요
      </Typography>
      <Paper elevation={3} style={styles.paper}>
        {/* 이벤트 선택 */}
        <TextField
          select
          label="이벤트 선택"
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
          fullWidth
          margin="normal"
        >
          {events.map((event) => {
            const matchedEvent = eventMapping.find(
              (mapping) => mapping.code === event.event_name
            );
            const displayName = matchedEvent
              ? matchedEvent.name
              : event.event_name;
            return (
              <MenuItem key={event.id} value={event.event_name}>
                {displayName} - {event.event_year}
              </MenuItem>
            );
          })}
        </TextField>
        {/* 교회등록번호 입력 */}
        <TextField
          label="교회등록번호 입력"
          type="text"
          value={churchNumber}
          onChange={handleChurchNumberChange}
          fullWidth
          margin="normal"
          inputProps={{ maxLength: 3 }} // 최대 3자리 입력 제한
        />
        {/* 핀번호 입력 */}
        <TextField
          label="전화번호 뒤 8자리 숫자 (010-xxxxxxxx) "
          type="text"
          value={pinNumber}
          onChange={handlePinChange}
          fullWidth
          margin="normal"
          inputProps={{ maxLength: 8 }} // 최대 8자리 입력 제한
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleEventSelection}
          style={{ marginTop: "20px" }}
        >
          신청 및 수정
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleCheckNavigation}
          style={{ marginTop: "20px", marginLeft: "10%" }}
        >
          조회 및 자료제출
        </Button>
      </Paper>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#fff",
  },
  paper: {
    width: "100%",
    maxWidth: "400px",
    padding: "20px",
    textAlign: "center",
  },
};

export default ChurchRegisterPage;
