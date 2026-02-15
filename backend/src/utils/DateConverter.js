export const calculateActualDate = async(targetDay, timeLine)=>{
    let today = new Date();

    let currentDay = today.getDay();
    let daysToAddOrSub;
    const finalDate = new Date(today);
    if(currentDay===0) currentDay = 7; // converting sunday (0) to (7)
    if(timeLine==1){ // 1 for past, 2 for future
        daysToAddOrSub = currentDay - targetDay
        if(daysToAddOrSub<0) daysToAddOrSub+=7;
        finalDate.setDate(today.getDate() - daysToAddOrSub)
    }
    else {
        daysToAddOrSub =  targetDay - currentDay
        if(daysToAddOrSub<0) daysToAddOrSub+=7;
        finalDate.setDate(today.getDate() + daysToAddOrSub)
    }    
    
    finalDate.setHours(5, 30, 0, 0); // adding 5:30 to handle utc->ist
    return finalDate;


}