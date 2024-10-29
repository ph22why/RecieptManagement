import React, { useState, useEffect } from "react";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";

const AdminPage = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null); // 선택된 이벤트 저장
  const [eventData, setEventData] = useState([]); // 선택된 이벤트의 데이터 저장
  const [headers, setHeaders] = useState([]); // 동적으로 컬럼 헤더 저장
  const [isPublic, setIsPublic] = useState(0); // 공개 여부 상태
  const [editRow, setEditRow] = useState(null); // 수정 중인 행 저장
  const [newRow, setNewRow] = useState(null); // 새로운 행 저장
  const [isAddingRow, setIsAddingRow] = useState(false); // 새로운 행 추가 중인지 확인
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false); // 저장 확인 팝업
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false); // 삭제 확인 팝업
  const [deleteRowId, setDeleteRowId] = useState(null); // 삭제할 행의 ID 저장

  // 서버에서 이벤트 목록을 가져오는 함수
  const fetchEvents = async () => {
    try {
      const response = await fetch("http://www.awanaevent.com:8080/admin/events");
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  // 이벤트 공개 여부 설정
  const handleSetPublic = async (eventId, isPublic) => {
    try {
      const response = await fetch(
        `http://www.awanaevent.com:8080/admin/events/${eventId}/public`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ is_public: isPublic }),
        }
      );

      if (response.ok) {
        alert(`이벤트가 ${isPublic ? "공개" : "비공개"}되었습니다.`);
        fetchEvents(); // 공개 상태 업데이트
      } else {
        alert("공개 설정에 실패했습니다.");
      }
    } catch (error) {
      console.error("Error setting event public:", error);
    }
  };

  // 수정된 데이터를 저장하는 함수
  const handleSaveRow = async () => {
    if (!selectedEvent) {
      alert("이벤트를 선택하세요.");
      return;
    }

    try {
      const response = await fetch(
        `http://www.awanaevent.com:8080/admin/events/${selectedEvent.id}/data/${editRow.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...editRow, // 수정된 데이터
            event_year: selectedEvent.event_year, // 이벤트의 연도
            event_name: selectedEvent.event_name, // 이벤트 이름
          }),
        }
      );

      if (response.ok) {
        alert("데이터가 성공적으로 저장되었습니다.");
        fetchEventData(selectedEvent.id); // 수정된 데이터 다시 불러오기
        setEditRow(null); // 수정 상태 초기화
      } else {
        alert("데이터 저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("Error saving row:", error);
    }
  };

  // 선택된 이벤트의 데이터를 가져오는 함수 (컬럼명 포함)
  const fetchEventData = async (eventId) => {
    try {
      const response = await fetch(
        `http://www.awanaevent.com:8080/admin/events/${eventId}/data`
      );
      const data = await response.json();

      if (data.length > 0) {
        const columnNames = Object.keys(data[0]); // 첫 번째 행의 키들을 컬럼명으로 사용
        setHeaders(columnNames);
        setEventData(data);
      } else {
        setHeaders([]); // 데이터가 없을 경우 헤더를 비워둠
        setEventData([]);
      }
    } catch (error) {
      console.error("Error fetching event data:", error);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // 이벤트 선택 처리
  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setIsPublic(event.is_public); // 공개 여부를 상태로 설정
    fetchEventData(event.id); // 선택된 이벤트의 데이터 가져오기
  };

  // 수정 중인 행 처리
  const handleEditRow = (row) => {
    setEditRow(row);
  };

  // 수정 확인 팝업 열기
  const handleSaveConfirmation = () => {
    setOpenConfirmDialog(true);
  };

  // 삭제 확인 팝업 열기
  const handleDeleteConfirmation = (rowId) => {
    setDeleteRowId(rowId);
    setOpenDeleteDialog(true);
  };

  // 수정 데이터 저장 확인
  const handleConfirmSave = async () => {
    await handleSaveRow(); // 수정 데이터를 백엔드로 저장
    setOpenConfirmDialog(false); // 팝업 닫기
    setEditRow(null); // 수정 중인 행 초기화
  };

  // 삭제 데이터 확인
  const handleConfirmDelete = async () => {
    await handleDeleteRow(deleteRowId); // 선택된 행 삭제
    setOpenDeleteDialog(false); // 팝업 닫기
    setDeleteRowId(null); // 삭제 상태 초기화
  };

  // 팝업에서 취소 시
  const handleCancelDialog = () => {
    setOpenConfirmDialog(false); // 수정 팝업 닫기
    setOpenDeleteDialog(false); // 삭제 팝업 닫기
  };

  // 데이터 삭제 처리
  const handleDeleteRow = async (rowId) => {
    try {
      const response = await fetch(
        `http://www.awanaevent.com:8080/admin/events/${selectedEvent.id}/data/${rowId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        alert("데이터가 성공적으로 삭제되었습니다.");
        fetchEventData(selectedEvent.id); // 삭제 후 데이터 다시 불러오기
      } else {
        alert("데이터 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("Error deleting data:", error);
    }
  };

  // 교회 데이터 유효성 확인 함수 (CHURCHNAME 및 CHURCHNUMBER가 존재하는지 확인)
  const filterValidRows = (row) => {
    return row["CHURCHNAME"] && row["CHURCHNUMBER"];
  };

  // 개별 추가 버튼 클릭 시 빈 데이터 생성
  const handleAddRow = () => {
    if (isAddingRow) {
      setNewRow(null); // 개별 추가 취소 시 초기화
      setIsAddingRow(false);
    } else {
      const maxId = Math.max(...eventData.map((row) => row.id || 0), 0);
      const maxNo = Math.max(...eventData.map((row) => row.NO || 0), 0);

      const emptyRow = headers.reduce(
        (acc, header) => {
          if (header === "id") acc["id"] = maxId + 1; // id 자동 설정
          else if (header === "NO") acc["NO"] = maxNo + 1; // NO 자동 설정
          else acc[header] = ""; // 다른 값은 빈 값으로 초기화
          return acc;
        },
        { id: maxId + 1, NO: maxNo + 1 }
      );

      setNewRow(emptyRow); // 새 행을 상태로 설정
      setIsAddingRow(true); // 개별 추가 중으로 설정
    }
  };

  // 개별 추가된 데이터를 저장
  const handleSaveNewRow = async () => {
    try {
      const response = await fetch(
        `http://www.awanaevent.com:8080/admin/events/${selectedEvent.id}/data`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newRow),
        }
      );

      if (response.ok) {
        alert("데이터가 성공적으로 추가되었습니다.");
        fetchEventData(selectedEvent.id); // 추가된 데이터 다시 불러오기
        setNewRow(null); // 새 행 초기화
        setIsAddingRow(false); // 추가 중 상태 초기화
      } else {
        alert("데이터 추가에 실패했습니다.");
      }
    } catch (error) {
      console.error("Error adding new row:", error);
    }
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        이벤트 관리 페이지
      </Typography>

      {/* 이벤트 목록 */}
      <TableContainer component={Paper} style={{ marginTop: 32 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>이벤트 이름</TableCell>
              <TableCell>이벤트 연도</TableCell>
              <TableCell>공개 여부</TableCell>
              <TableCell>공개 설정</TableCell>
              <TableCell>데이터 조회</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell>{event.event_name}</TableCell>
                <TableCell>{event.event_year}</TableCell>
                <TableCell>{event.is_public ? "공개" : "비공개"}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    color={event.is_public ? "secondary" : "primary"}
                    onClick={() =>
                      handleSetPublic(event.id, event.is_public ? 0 : 1)
                    }
                  >
                    {event.is_public ? "비공개로 설정" : "공개로 설정"}
                  </Button>
                </TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    onClick={() => handleSelectEvent(event)}
                  >
                    데이터 조회
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 선택된 이벤트 데이터 조회 */}
      {selectedEvent && (
        <div style={{ marginTop: 32 }}>
          <Typography variant="h5" gutterBottom>
            {selectedEvent.event_name} 데이터 관리
          </Typography>

          <Button
            variant="contained"
            color={isAddingRow ? "secondary" : "primary"}
            onClick={handleAddRow}
            style={{ marginBottom: 16 }}
          >
            {isAddingRow ? "취소" : "개별 추가"}
          </Button>

          <TableContainer component={Paper} style={{ marginTop: 16 }}>
            <Table>
              <TableHead>
                <TableRow>
                  {headers.map((header, index) => (
                    <TableCell key={index}>{header}</TableCell>
                  ))}
                  <TableCell>수정</TableCell>
                  <TableCell>삭제</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {newRow && (
                  <TableRow>
                    {headers.map((header, index) => (
                      <TableCell key={index}>
                        <TextField
                          value={newRow[header]}
                          onChange={(e) =>
                            setNewRow({ ...newRow, [header]: e.target.value })
                          }
                        />
                      </TableCell>
                    ))}
                    <TableCell>
                      <Button variant="contained" onClick={handleSaveNewRow}>
                        저장
                      </Button>
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                )}

                {eventData
                  .filter(filterValidRows) // CHURCHNAME과 CHURCHNUMBER가 있는 행만 필터링
                  .map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {headers.map((header, cellIndex) => (
                        <TableCell key={cellIndex}>
                          {editRow && editRow.id === row.id ? (
                            <TextField
                              value={editRow[header]}
                              onChange={(e) =>
                                setEditRow({
                                  ...editRow,
                                  [header]: e.target.value,
                                })
                              }
                            />
                          ) : (
                            row[header]
                          )}
                        </TableCell>
                      ))}
                      <TableCell>
                        {editRow && editRow.id === row.id ? (
                          <Button
                            variant="contained"
                            onClick={handleSaveConfirmation}
                          >
                            저장
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            onClick={() => handleEditRow(row)}
                          >
                            수정
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          color="secondary"
                          onClick={() => handleDeleteConfirmation(row.id)}
                        >
                          삭제
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      )}

      {/* 저장 확인 팝업 */}
      <Dialog open={openConfirmDialog} onClose={handleCancelDialog}>
        <DialogTitle>저장 확인</DialogTitle>
        <DialogContent>수정 내용을 저장하시겠습니까?</DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDialog} color="primary">
            취소
          </Button>
          <Button onClick={handleConfirmSave} color="primary">
            저장
          </Button>
        </DialogActions>
      </Dialog>

      {/* 삭제 확인 팝업 */}
      <Dialog open={openDeleteDialog} onClose={handleCancelDialog}>
        <DialogTitle>삭제 확인</DialogTitle>
        <DialogContent>정말로 삭제하시겠습니까?</DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDialog} color="primary">
            취소
          </Button>
          <Button onClick={handleConfirmDelete} color="secondary">
            삭제
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AdminPage;
