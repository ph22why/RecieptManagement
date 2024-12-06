const YSForm = () => {
    return (
      <div>
        <h2>영성수련회 참가 양식</h2>
        <form>
          {/* 양식 필드 */}
          <input type="text" placeholder="교회 이름" />
          <input type="email" placeholder="이메일 주소" />
          <button type="submit">제출</button>
        </form>
      </div>
    );
  };
  
  export default YSForm;
  