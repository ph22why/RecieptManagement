import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  TextField,
  Typography,
  Paper,
  Select,
  MenuItem,
  Divider,
  InputLabel,
  Grid2,
} from "@mui/material";

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://awanaevent.com"
    : "http://localhost:8080";

const BQForm = ({ tableName, fullPin }) => {
  const [basicInfo, setBasicInfo] = useState({
    id: 1000,
    region: "",
    church_number: "",
    church_name: "",
    representative: "",
    contact: "",
  });
  const [sparksList, setSparksList] = useState([]);
  const [ttList, setTtList] = useState([]);
  const [observers, setObservers] = useState([
    {
      id: 1,
      name: "Sparks 클럽원 (선수 외의)",
      count: 0,
      hasMeal: true,
      hasPin: true,
    },
    {
      id: 2,
      name: "Sparks 교사 (코치 외의)",
      count: 0,
      hasMeal: true,
      hasPin: true,
    },
    {
      id: 3,
      name: "T&T 클럽원 (선수 외의)",
      count: 0,
      hasMeal: true,
      hasPin: true,
    },
    {
      id: 4,
      name: "T&T 교사 (코치 외의)",
      count: 0,
      hasMeal: true,
      hasPin: true,
    },
    {
      id: 5,
      name: "학부모 포함 식권 별도 구입인원",
      count: 0,
      hasMeal: true,
      hasPin: false,
    },
  ]);

  // 초기화 시 연락처를 변환
  useEffect(() => {
    if (fullPin) {
      setBasicInfo((prev) => ({
        ...prev,
        church_number: fullPin.substring(0, 3), // 등록번호 3자리
        contact: `010-${fullPin.substring(3, 7)}-${fullPin.substring(7)}`, // 연락처 010-4자리-4자리
      }));
    }
  }, [fullPin]);

  // 추가 쿼리 생성
  const handleAddSparks = () => {
    const newId =
      sparksList.length > 0
        ? sparksList[sparksList.length - 1].id + 1 // 마지막 ID + 1
        : 1; // 첫 데이터인 경우 ID = 1

    const newUiNumber =
      sparksList.length > 0
        ? sparksList[sparksList.length - 1].uiNumber + 1 // 마지막 UI 번호 + 1
        : 1; // 첫 데이터인 경우 UI 번호 = 1

    setSparksList([
      ...sparksList,
      {
        id: newId,
        handbook: "",
        uiNumber: newUiNumber,
        churchName: basicInfo.churchName || "",
        playerName: "",
        coachName: "",
        coachContact: "",
      },
    ]);
  };

  const handleAddTt = () => {
    const newId = ttList.length > 0 ? ttList[ttList.length - 1].id + 1 : 1;
    const newUiNumber =
      ttList.length > 0
        ? ttList[ttList.length - 1].uiNumber + 1 // 마지막 UI 번호 + 1
        : 1; // 첫 데이터인 경우 UI 번호 = 1
    setTtList([
      ...ttList,
      {
        id: newId,
        uiNumber: newUiNumber,
        handbook: "",
        churchName: basicInfo.churchName || "",
        playerName: "",
        coachName: "",
        coachContact: "",
      },
    ]);
  };

  const deleteParticipant = async (id, tableName) => {
    try {
      const response = await fetch(
        `${BASE_URL}/delete-participant/${tableName}/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete participant.");
      }

      console.log(`Participant with id ${id} deleted from ${tableName}`);
    } catch (error) {
      console.error("Error deleting participant:", error.message);
      alert("삭제 중 문제가 발생했습니다.");
    }
  };

  // 삭제 쿼리 생성
  const handleRemoveSparks = async (id) => {
    try {
      await deleteParticipant(id, tableName); // 백엔드 요청
      setSparksList(
        (prevSparksList) =>
          prevSparksList
            .filter((item) => item.id !== id) // 삭제
            .map((item, index) => ({ ...item, uiNumber: index + 1 })) // UI 번호 재정렬
      );
    } catch (error) {
      console.error("Error deleting Sparks participant:", error.message);
    }
  };

  const handleRemoveTt = async (id) => {
    try {
      await deleteParticipant(id, tableName); // 백엔드 요청
      setTtList(
        (prevTtList) =>
          prevTtList
            .filter((item) => item.id !== id) // 삭제
            .map((item, index) => ({ ...item, uiNumber: index + 1 })) // UI 번호 재정렬
      );
    } catch (error) {
      console.error("Error deleting T&T participant:", error.message);
    }
  };
  const navigate = useNavigate();

  // 신청완료 버튼 클릭 시 데이터 요청 생성
  const handleSubmit = async () => {
    const payload = {
      basicInfo: {
        id: 1000,
        region: basicInfo.region,
        churchNumber: fullPin.substring(0, 3),
        church_name: basicInfo.church_name,
        representative: basicInfo.representative,
        contact: "010" + fullPin.substring(3),
        category: "basicInfo",
      },
      sparksParticipants: sparksList.map((item) => ({
        id: item.id || null,
        churchName: item.churchName || basicInfo.church_name || "",
        representative: basicInfo.representative || "",
        contact: basicInfo.contact || "",
        category: (item.category || "Sparks").trim(),
        handbook: item.handbook || "",
        playerName: item.playerName || "",
        coachName: item.coachName || "",
        coachContact: item.coachContact || "",
      })),
      ttParticipants: ttList.map((item) => ({
        id: item.id || null,
        churchName: item.churchName || basicInfo.church_name || "",
        representative: basicInfo.representative || "",
        contact: basicInfo.contact || "",
        category: (item.category || "T&T").trim(),
        handbook: item.handbook || "",
        playerName: item.playerName || "",
        coachName: item.coachName || "",
        coachContact: item.coachContact || "",
      })),
      observers: observers.map((observer) => ({
        id: observer.id,
        observerName: observer.name,
        observerCount: observer.count,
        hasMeal: observer.hasMeal,
        hasPin: observer.hasPin,
        category: "Observer",
      })),
    };

    console.log("Payload for submission:", payload);

    try {
      const response = await fetch(
        `${BASE_URL}/submit-registration/${tableName}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) throw new Error("Failed to submit data");
      alert("접수가 완료되었습니다!");
      navigate("/");
    } catch (err) {
      console.error("Error submitting data:", err.message);
      alert(
        "접수 중 오류가 발생했습니다. 다시 시도해주세요. 계속 오류 발생시 본부로 문의해주세요."
      );
    }
  };

  useEffect(() => {
    const fetchExistingData = async () => {
      try {
        const response = await fetch(`${BASE_URL}/register/${tableName}`);
        if (!response.ok) throw new Error("Failed to fetch existing data");

        const data = await response.json();

        console.log("Fetched Data:", data); // API 응답 전체 확인

        // 기본 정보 업데이트
        console.log("Basic Info:", data.basicInfo);
        setBasicInfo({
          region: data.basicInfo?.region || "",
          // churchNumber: data.basicInfo?.churchNumber || "",
          church_name: data.basicInfo?.church_name || "",
          representative: data.basicInfo?.representative || "",
          // contact: data.basicInfo?.contact || "",
        });

        // Observer 데이터 매핑 및 업데이트
        const updatedObservers = observers.map((observer) => {
          const matchedObserver = data.observers.find(
            (item) => item.observer_name === observer.name
          );
          return matchedObserver
            ? { ...observer, count: matchedObserver.observer_count }
            : observer;
        });
        console.log("Updated Observers:", updatedObservers);
        setObservers(updatedObservers);

        // Sparks 데이터 업데이트
        console.log("Sparks List Data:", data.sparksList);
        setSparksList(
          data.sparksList.map((item, index) => ({
            id: item.id,
            handbook: item.handbook,
            churchName: item.church_name, // 이름 변환
            playerName: item.player_name, // 이름 변환
            coachName: item.coach_name, // 이름 변환
            coachContact: item.coach_contact, // 이름 변환
            uiNumber: index + 1, // UI 번호 추가
          }))
        );

        // T&T 데이터 업데이트
        console.log("T&T List Data:", data.ttList);
        setTtList(
          data.ttList.map((item, index) => ({
            id: item.id,
            handbook: item.handbook,
            churchName: item.church_name, // 이름 변환
            playerName: item.player_name, // 이름 변환
            coachName: item.coach_name, // 이름 변환
            coachContact: item.coach_contact, // 이름 변환
            uiNumber: index + 1, // UI 번호 추가
          }))
        );
      } catch (error) {
        console.error("Error fetching existing data:", error.message);
      }
    };

    fetchExistingData();
  }, [tableName]);

  const calculateItems = () => {
    const sparksPins = sparksList.length;
    const ttPins = ttList.length;

    // 코치의 고유한 쌍 추출
    const uniqueSparksCoaches = new Set(
      sparksList.map((item) => `${item.coachName}-${item.coachContact}`)
    );
    const uniqueTtCoaches = new Set(
      ttList.map((item) => `${item.coachName}-${item.coachContact}`)
    );

    // 코치 수 계산
    const sparksCoaches = uniqueSparksCoaches.size;
    const ttCoaches = uniqueTtCoaches.size;

    // 참관 인원 계산
    const sparkObserverPins = parseInt(observers[0].count || 0, 10);
    const ttObserverPins = parseInt(observers[2].count || 0, 10);
    const extraMealTickets = parseInt(observers[4].count || 0, 10);

    // 총 식권 계산
    const totalMealTickets =
      sparksPins + ttPins + sparksCoaches + ttCoaches + extraMealTickets;

    // 선수인원계산
    const sparksStudent = sparksPins - sparksCoaches;
    const ttStudent = ttPins - ttCoaches;

    return {
      sparksPins,
      ttPins,
      sparkObserverPins,
      ttObserverPins,
      totalMealTickets,
      sparksCoaches,
      ttCoaches,
      sparksStudent,
      ttStudent,
    };
  };

  const counts = {
    // Sparks 참가자 수
    sparksPlayers: sparksList.length, // 분류1에서 입력받은 Sparks 선수 수
    sparksCoaches: new Set(
      sparksList
        .filter((item) => item.coachName?.trim() && item.coachContact?.trim()) // 유효한 코치만 포함
        .map((item) => `${item.coachName}-${item.coachContact}`)
    ).size, // Sparks 코치 (중복 제거)

    // T&T 참가자 수
    ttPlayers: ttList.length, // 분류2에서 입력받은 T&T 선수 수
    ttCoaches: new Set(
      ttList
        .filter((item) => item.coachName?.trim() && item.coachContact?.trim()) // 유효한 코치만 포함
        .map((item) => `${item.coachName}-${item.coachContact}`)
    ).size, // T&T 코치 (중복 제거)

    // 참관자 수
    observers: observers.reduce(
      (total, obs) => parseInt(total) + parseInt(obs.count),
      0
    ), // 분류3에서 입력받은 참관자 인원 합계

    // Sparks/T&T 코치 표식
    sparksCoachMarkers:
      parseInt(
        new Set(
          sparksList
            .filter(
              (item) => item.coachName?.trim() && item.coachContact?.trim()
            ) // 유효한 코치만 포함
            .map((item) => `${item.coachName}-${item.coachContact}`)
        ).size
      ) + parseInt(observers[1].count), // Sparks 코치 + Sparks 참관 교사 수
    ttCoachMarkers:
      parseInt(
        new Set(
          ttList
            .filter(
              (item) => item.coachName?.trim() && item.coachContact?.trim()
            ) // 유효한 코치만 포함
            .map((item) => `${item.coachName}-${item.coachContact}`)
        ).size
      ) + parseInt(observers[3].count), // T&T 코치 + T&T 참관 교사 수

    // Sparks 선수 핀 계산
    sparksPins: {
      행글라이더: sparksList.filter(
        (item) =>
          item.handbook &&
          item.handbook.includes("행글라이더") &&
          (item.coachName?.trim() || item.coachContact?.trim())
      ).length,
      윙러너: sparksList.filter(
        (item) =>
          item.handbook &&
          item.handbook.includes("윙러너") &&
          (item.coachName?.trim() || item.coachContact?.trim())
      ).length,
      스카이스토머: sparksList.filter(
        (item) =>
          item.handbook &&
          item.handbook.includes("스카이스토머") &&
          (item.coachName?.trim() || item.coachContact?.trim())
      ).length,
    },

    // T&T 선수 핀 계산
    ttPins: {
      어드밴처1: ttList.filter(
        (item) =>
          item.handbook &&
          item.handbook.includes("어드밴처1") &&
          (item.coachName?.trim() || item.coachContact?.trim())
      ).length,
      어드밴처2: ttList.filter(
        (item) =>
          item.handbook &&
          item.handbook.includes("어드밴처2") &&
          (item.coachName?.trim() || item.coachContact?.trim())
      ).length,
      챌린지1: ttList.filter(
        (item) =>
          item.handbook &&
          item.handbook.includes("챌린지1") &&
          (item.coachName?.trim() || item.coachContact?.trim())
      ).length,
      챌린지2: ttList.filter(
        (item) =>
          item.handbook &&
          item.handbook.includes("챌린지2") &&
          (item.coachName?.trim() || item.coachContact?.trim())
      ).length,
    },
  };

  // Calculated Costs
  const calculateCosts = () => {
    const sparksCost = counts.sparksPlayers * 25000; // 스팍스 선수 1인
    const sparksCoachCost = counts.sparksCoaches * 20000;
    const ttCost = counts.ttPlayers * 25000; // 티앤티 선수 1인
    const ttCoachCost = counts.ttCoaches * 20000;
    const observerCosts =
      observers[0].count * 12000 +
      observers[1].count * 12000 +
      observers[2].count * 12000 +
      observers[3].count * 12000 +
      observers[4].count * 8000;

    return sparksCost + sparksCoachCost + ttCost + ttCoachCost + observerCosts;
  };

  const items = calculateItems();
  const costs = calculateCosts();

  const handleBasicInfoChange = (e) => {
    const { name, value } = e.target;
    setBasicInfo((prev) => ({ ...prev, [name]: value.replace(/\s+/g, ""), }));
  };

  const handleSparksChange = (index, field, value) => {
    setSparksList((prevSparksList) =>
      prevSparksList.map((spark, i) =>
        i === index ? { ...spark, [field]: value.replace(/\s+/g, ""), } : spark
      )
    );
  };

  const handleTtChange = (index, field, value) => {
    setTtList((prevTtList) =>
      prevTtList.map((tt, i) => (i === index ? { ...tt, [field]: value.replace(/\s+/g, ""), } : tt))
    );
  };

  const handleObserverChange = (index, field, value) => {
    setObservers((prevObservers) =>
      prevObservers.map((observer, i) =>
        i === index ? { ...observer, [field]: value.replace(/\s+/g, ""), } : observer
      )
    );
  };

  return (
    <div style={styles.container}>
      {/* 기본정보 */}
      <Typography variant="h4" style={{ marginBottom: "20px" }}>
        성경퀴즈대회 참가 신청
      </Typography>
      <Paper elevation={3} style={styles.paper}>
        <Typography
          variant="h6"
          style={{ marginBottom: "10px" }}
          color="blue"
          fontWeight={600}
        >
          기본 정보
        </Typography>
        <InputLabel id="region-label" style={{ marginLeft: "10px" }}>
          참가지역 선택
        </InputLabel>
        <Select
          labelId="region-label"
          value={basicInfo.region}
          name="region"
          onChange={handleBasicInfoChange}
          fullWidth
          margin="normal"
          style={styles.dropdown}
        >
          <MenuItem value="경상">1월 4일 경상 (포항기쁨의교회)</MenuItem>
          <MenuItem value="서울강원">1월 11일 서울, 강원 (왕성교회)</MenuItem>
          <MenuItem value="충청">1월 11일 충청(대전중앙교회)</MenuItem>
          <MenuItem value="전라">1월 11일 전라(여수성광교회)</MenuItem>
          <MenuItem value="경기인천강원">
            1월 18일 경기, 인천, 강원(인천숭의교회)
          </MenuItem>
        </Select>
        <TextField
          // label="등록번호"
          value={basicInfo.church_number}
          name="church_number"
          onChange={handleBasicInfoChange}
          fullWidth
          disabled
          margin="normal"
        />
        <TextField
          label="교회명"
          value={basicInfo.church_name}
          name="church_name"
          onChange={handleBasicInfoChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="담당자"
          value={basicInfo.representative}
          name="representative"
          onChange={handleBasicInfoChange}
          fullWidth
          margin="normal"
        />
        <TextField
          // label="연락처"
          value={basicInfo.contact}
          name="contact"
          disabled
          onChange={handleBasicInfoChange}
          fullWidth
          margin="normal"
        />
      </Paper>

      {/* 분류 1: Sparks 선수 */}
      <Paper elevation={3} style={styles.paper}>
        <Typography variant="h6" color="blue" fontWeight={600}>
          Sparks 선수 명단
        </Typography>
        {sparksList.map((item, index) => (
          <div key={item.id} style={styles.row}>
            <Typography>{item.uiNumber}</Typography> {/* UI 상의 순서 */}
            <Select
              value={item.handbook}
              onChange={(e) =>
                handleSparksChange(index, "handbook", e.target.value)
              }
              style={styles.dropdown}
            >
              <MenuItem value="행글라이더 1학년">행글라이더 1학년</MenuItem>
              <MenuItem value="행글라이더 2학년">행글라이더 2학년</MenuItem>
              <MenuItem value="윙러너 1학년">윙러너 1학년</MenuItem>
              <MenuItem value="윙러너 2학년">윙러너 2학년</MenuItem>
              <MenuItem value="스카이스토머 2학년">스카이스토머 2학년</MenuItem>
            </Select>
            <TextField
              value={basicInfo.church_name}
              onChange={(e) =>
                handleSparksChange(index, "churchName", e.target.value)
              }
              placeholder="교회명"
            />
            <TextField
              value={item.playerName}
              onChange={(e) =>
                handleSparksChange(index, "playerName", e.target.value)
              }
              placeholder="선수이름"
            />
            <TextField
              value={item.coachName}
              onChange={(e) =>
                handleSparksChange(index, "coachName", e.target.value)
              }
              placeholder="코치이름"
            />
            <TextField
              value={item.coachContact}
              onChange={(e) =>
                handleSparksChange(index, "coachContact", e.target.value)
              }
              placeholder="코치연락처"
            />
            <Button
              variant="contained"
              color="secondary"
              onClick={() => {
                if (window.confirm("정말 삭제하시겠습니까?")) {
                  handleRemoveSparks(item.id); // 상태에서 제거 및 백엔드 요청
                }
              }}
              style={{ marginLeft: "10px" }}
            >
              삭제
            </Button>
          </div>
        ))}
        <Button
          variant="contained"
          onClick={handleAddSparks}
          style={{ marginTop: "10px" }}
        >
          추가
        </Button>
      </Paper>

      {/* 분류 2: T&T 선수 */}
      <Paper elevation={3} style={styles.paper}>
        <Typography variant="h6" color="blue" fontWeight={600}>
          T&T 선수 명단
        </Typography>
        {ttList.map((item, index) => (
          <div key={item.id} style={styles.row}>
            <Typography>{item.uiNumber}</Typography> {/* UI 상의 순서 */}
            <Select
              value={item.handbook}
              onChange={(e) =>
                handleTtChange(index, "handbook", e.target.value)
              }
              style={styles.dropdown}
            >
              <MenuItem value="어드밴처1권 3학년">어드밴처1권 3학년</MenuItem>
              <MenuItem value="어드밴처1권 4학년">어드밴처1권 4학년</MenuItem>
              <MenuItem value="어드밴처2권 4학년">어드밴처2권 4학년</MenuItem>
              <MenuItem value="챌린지1권 5학년">챌린지1권 5학년</MenuItem>
              <MenuItem value="챌린지1권 6학년">챌린지1권 6학년</MenuItem>
              <MenuItem value="챌린지2권 6학년">챌린지2권 6학년</MenuItem>
            </Select>
            <TextField
              value={basicInfo.church_name}
              onChange={(e) =>
                handleTtChange(index, "churchName", e.target.value)
              }
              placeholder="교회명"
            />
            <TextField
              value={item.playerName}
              onChange={(e) =>
                handleTtChange(index, "playerName", e.target.value)
              }
              placeholder="선수이름"
            />
            <TextField
              value={item.coachName}
              onChange={(e) =>
                handleTtChange(index, "coachName", e.target.value)
              }
              placeholder="코치이름"
            />
            <TextField
              value={item.coachContact}
              onChange={(e) =>
                handleTtChange(index, "coachContact", e.target.value)
              }
              placeholder="코치연락처"
            />
            <Button
              variant="contained"
              color="secondary"
              onClick={() => {
                if (window.confirm("정말 삭제하시겠습니까?")) {
                  handleRemoveTt(item.id); // 상태에서 제거 및 백엔드 요청
                }
              }}
              style={{ marginLeft: "10px" }}
            >
              삭제
            </Button>
          </div>
        ))}
        <Button
          variant="contained"
          onClick={handleAddTt}
          style={{ marginTop: "10px" }}
        >
          추가
        </Button>
      </Paper>

      {/* 분류 3: 참관자 */}
      <Paper elevation={3} style={styles.paper}>
        <Typography variant="h6" color="blue" fontWeight={600}>
          선수 외의 참관자
        </Typography>
        {observers.map((observer, index) => (
          <div key={observer.id} style={styles.row}>
            <Typography style={{ width: "300px" }}>{observer.name}</Typography>
            <TextField
              type="number"
              value={observer.count}
              onChange={(e) =>
                handleObserverChange(index, "count", e.target.value)
              }
              placeholder="인원수"
              style={{ width: "100px" }}
            />

            <Typography>
              {observer.hasMeal ? "식권 O" : "식권 X"},{" "}
              {observer.hasPin ? "참가핀 O" : "참가핀 X"}
            </Typography>
          </div>
        ))}
      </Paper>

      <Paper elevation={3} style={{ padding: "20px", marginTop: "20px" }}>
        <Typography variant="h6" color="blue" fontWeight={600}>
          접수 내역
        </Typography>
        <Divider style={{ margin: "10px 0" }} />

        <Grid2 container spacing={4}>
          <Grid2 item xs={12} md={6}>
            <Typography
              variant="subtitle1"
              style={{ marginBottom: "10px" }}
              color="#3a6596"
              fontWeight={600}
            >
              참가비용 안내
            </Typography>
            <Typography color="#4a4a4a">Sparks/T&T 선수: 25,000원</Typography>
            <Typography color="#4a4a4a">Sparks/T&T 코치: 20,000원</Typography>
            <Typography color="#4a4a4a">참관자: 12,000원</Typography>
            <Typography color="#4a4a4a">추가 식사자: 8,000원</Typography>
            <Divider style={{ margin: "10px 0" }} />
          </Grid2>

          <Grid2 item xs={12} md={6} marginLeft={"20px"}>
            <Typography
              variant="subtitle1"
              style={{ marginBottom: "10px" }}
              color="#3a6596"
              fontWeight={600}
            >
              Sparks 핀
            </Typography>
            <Typography color="#4a4a4a">
              행글라이더: {counts.sparksPins["행글라이더"]}개
            </Typography>
            <Typography color="#4a4a4a">
              윙러너: {counts.sparksPins["윙러너"]}개
            </Typography>
            <Typography color="#4a4a4a">
              스카이스토머: {counts.sparksPins["스카이스토머"]}개
            </Typography>
            <Divider style={{ margin: "10px 0" }} />
            <Typography variant="subtitle1" color="#3a6596" fontWeight={600}>
              T&T 핀
            </Typography>
            <Typography color="#4a4a4a">
              어드밴처1: {counts.ttPins["어드밴처1"]}개
            </Typography>
            <Typography color="#4a4a4a">
              어드밴처2: {counts.ttPins["어드밴처2"]}개
            </Typography>
            <Typography color="#4a4a4a">
              챌린지1: {counts.ttPins["챌린지1"]}개
            </Typography>
            <Typography color="#4a4a4a">
              챌린지2: {counts.ttPins["챌린지2"]}개
            </Typography>
            <Divider style={{ margin: "10px 0" }} />
          </Grid2>
          <Grid2 marginLeft={"0px"} item xs={12} md={6}>
            <Typography variant="subtitle1" color="#303f9f" fontWeight={600}>
              최종 수령 품목 및 수량
            </Typography>
            <Typography color="#2e2e2e">
              Sparks 참관핀: {items.sparkObserverPins}개
            </Typography>
            <Typography color="#2e2e2e">
              T&T 참관핀: {items.ttObserverPins}개
            </Typography>
            <Typography color="#2e2e2e">
              Sparks 코치 표식: {counts.sparksCoachMarkers}개
            </Typography>
            <Typography color="#2e2e2e">
              T&T 코치 표식: {counts.ttCoachMarkers}개
            </Typography>
            <Typography color="#2e2e2e">
              총 식권:{" "}
              {counts.sparksPlayers +
                counts.sparksCoaches +
                counts.ttPlayers +
                counts.ttCoaches +
                counts.observers}
              장
            </Typography>
            <Divider style={{ margin: "10px 0" }} />
            <Typography variant="subtitle1" color="#303f9f" fontWeight={600}>
              최종 참가 인원
            </Typography>
            <Typography color="#4a4a4a">
              Sparks 선수: {counts.sparksPlayers}명
            </Typography>
            <Typography color="#4a4a4a">
              Sparks 코치: {counts.sparksCoaches}명
            </Typography>
            <Typography color="#4a4a4a">
              T&T 선수: {counts.ttPlayers}명
            </Typography>
            <Typography color="#4a4a4a">
              T&T 코치: {counts.ttCoaches}명
            </Typography>
            <Typography color="#4a4a4a">
              참관자 + 추가 식사자: {counts.observers}명
            </Typography>
          </Grid2>
          <Grid2 marginLeft={"0px"} item xs={12} md={6}>
            <Typography variant="subtitle1" color="#303f9f" fontWeight={600}>
              총 참가비
            </Typography>
            <Typography color="#2e2e2e">
              {new Intl.NumberFormat().format(costs)}원
            </Typography>
          </Grid2>
        </Grid2>
      </Paper>

      <Button
        variant="contained"
        color="primary"
        style={{ marginTop: "20px" }}
        onClick={handleSubmit}
      >
        접수 완료
      </Button>
    </div>
  );
};

const styles = {
  container: { padding: "20px", fontFamily: "Arial, sans-serif" },
  paper: { padding: "20px", marginBottom: "20px" },
  row: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    marginBottom: "10px",
  },
  dropdown: { minWidth: "200px" },
};

export default BQForm;
