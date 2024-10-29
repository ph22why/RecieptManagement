import React, { useState, useEffect } from "react";
import {
  Button,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const AdminEventPage = () => {
  const [events, setEvents] = useState([]);
  const [churches, setChurches] = useState([]);
  const [newEvent, setNewEvent] = useState({ event_year: "", event_name: "" });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [newChurchForEvent, setNewChurchForEvent] = useState({
    event_id: "",
    church_id: "",
  });
  const [selectedFile, setSelectedFile] = useState(null); // 파일 업로드 상태 추가

  // 이벤트 목록을 가져오는 함수
  const fetchEvents = async () => {
    try {
      const response = await fetch("http://www.awanaevent.com:8080/admin/events");
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error("이벤트 목록 불러오기 오류:", error);
    }
  };

  // 교회 목록을 가져오는 함수
  const fetchChurches = async () => {
    try {
      const response = await fetch("http://www.awanaevent.com:8080/admin/churches");
      const data = await response.json();

      // 교회 데이터가 배열인지 확인 후 설정
      if (Array.isArray(data)) {
        setChurches(data);
      } else {
        setChurches([]); // 배열이 아닌 경우 빈 배열로 처리
      }
    } catch (error) {
      console.error("교회 목록 불러오기 오류:", error);
      setChurches([]); // 오류 발생 시 빈 배열로 설정
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchChurches();
  }, []);

  // 새로운 이벤트 추가
  const handleAddEvent = async () => {
    try {
      const response = await fetch("http://www.awanaevent.com:8080/admin/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_year: newEvent.event_year,
          event_name: newEvent.event_name,
          is_public: newEvent.is_public || 0, // 기본값으로 비공개 설정
        }),
      });

      if (response.ok) {
        alert("이벤트가 성공적으로 추가되었습니다.");
        fetchEvents(); // 이벤트 목록 다시 불러오기
        setNewEvent({ event_year: "", event_name: "", is_public: 0 });
      } else {
        const errorText = await response.text();
        alert(`이벤트 추가 실패: ${errorText}`);
      }
    } catch (error) {
      console.error("이벤트 추가 중 오류 발생:", error);
      alert("이벤트 추가 중 오류가 발생했습니다.");
    }
  };

  // 이벤트와 교회를 연결하는 함수
  const handleLinkChurchToEvent = async () => {
    try {
      const response = await fetch(
        `http://www.awanaevent.com:8080/admin/events/${newChurchForEvent.event_id}/churches/${newChurchForEvent.church_id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        alert("교회가 이벤트에 성공적으로 연결되었습니다.");
        setNewChurchForEvent({ event_id: "", church_id: "" });
      } else {
        const errorText = await response.text();
        alert(`연결 실패: ${errorText}`);
      }
    } catch (error) {
      console.error("교회-이벤트 연결 중 오류 발생:", error);
      alert("교회-이벤트 연결 중 오류가 발생했습니다.");
    }
  };

  // 파일 선택 처리 함수
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  // 엑셀 파일 업로드 및 테이블 생성
  const handleUploadFile = async () => {
    if (!selectedFile || !selectedEvent) {
      alert("이벤트를 선택하고 파일을 업로드해 주세요.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("event_year", selectedEvent.event_year);
    formData.append("event_name", selectedEvent.event_name);

    try {
      const response = await fetch("http://www.awanaevent.com:8080/admin/uploadExcel", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        alert("엑셀 파일이 성공적으로 업로드되었습니다.");
      } else {
        alert("엑셀 파일 업로드 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("파일 업로드 중 오류:", error);
      alert("파일 업로드 중 오류가 발생했습니다.");
    }
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        이벤트 관리 페이지
      </Typography>

      {/* 새로운 이벤트 추가 */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>새로운 이벤트 추가</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Paper elevation={3} style={{ padding: 16 }}>
            <TextField
              label="이벤트 이름"
              value={newEvent.event_name}
              onChange={(e) =>
                setNewEvent({ ...newEvent, event_name: e.target.value })
              }
              fullWidth
              margin="normal"
            />
            <TextField
              label="이벤트 연도"
              value={newEvent.event_year}
              onChange={(e) =>
                setNewEvent({ ...newEvent, event_year: e.target.value })
              }
              fullWidth
              margin="normal"
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddEvent}
              style={{ marginTop: 16 }}
            >
              이벤트 추가
            </Button>
          </Paper>
        </AccordionDetails>
      </Accordion>

      {/* 이벤트에 교회 연결 */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>이벤트에 교회 연결</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Paper elevation={3} style={{ padding: 16 }}>
            <TextField
              select
              label="이벤트 선택"
              value={newChurchForEvent.event_id}
              onChange={(e) =>
                setNewChurchForEvent({
                  ...newChurchForEvent,
                  event_id: e.target.value,
                })
              }
              fullWidth
              margin="normal"
            >
              {events.map((event) => (
                <MenuItem key={event.id} value={event.id}>
                  {event.event_name} - {event.event_year}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="교회 선택"
              value={newChurchForEvent.church_id}
              onChange={(e) =>
                setNewChurchForEvent({
                  ...newChurchForEvent,
                  church_id: e.target.value,
                })
              }
              fullWidth
              margin="normal"
            >
              {Array.isArray(churches) ? (
                churches.map((church) => (
                  <MenuItem key={church.id} value={church.id}>
                    {church.church_name}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>교회 목록을 불러올 수 없습니다.</MenuItem>
              )}
            </TextField>

            <Button
              variant="contained"
              color="primary"
              onClick={handleLinkChurchToEvent}
              style={{ marginTop: 16 }}
            >
              교회-이벤트 연결
            </Button>
          </Paper>
        </AccordionDetails>
      </Accordion>

      {/* 엑셀 파일 업로드 */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>엑셀 파일 업로드 및 테이블 생성</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Paper elevation={3} style={{ padding: 16 }}>
            <TextField
              select
              label="이벤트 선택"
              value={selectedEvent ? selectedEvent.id : ""}
              onChange={(e) => {
                const selected = events.find(
                  (event) => event.id === e.target.value
                );
                setSelectedEvent(selected);
              }}
              fullWidth
              margin="normal"
            >
              {events.map((event) => (
                <MenuItem key={event.id} value={event.id}>
                  {event.event_name} - {event.event_year}
                </MenuItem>
              ))}
            </TextField>

            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              style={{ marginTop: 16 }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleUploadFile}
              style={{ marginTop: 16 }}
            >
              파일 업로드
            </Button>
          </Paper>
        </AccordionDetails>
      </Accordion>

      {/* 이벤트 목록 */}
      <TableContainer component={Paper} style={{ marginTop: 32 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>이벤트 이름</TableCell>
              <TableCell>이벤트 연도</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell>{event.event_name}</TableCell>
                <TableCell>{event.event_year}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default AdminEventPage;
