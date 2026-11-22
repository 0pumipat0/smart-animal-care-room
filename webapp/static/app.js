const API = "http://localhost:8000";

let pmChart = null;


async function loadData() {

    try {

        const response =
            await fetch(API + "/api/status");

        const data =
            await response.json();


        if (data.length === 0) {
            return;
        }


        let pm = null;
        let env = null;


        for (let i = 0; i < data.length; i++) {

            if (
                data[i].type === "pm25" &&
                pm === null
            ) {

                pm = data[i];

            }


            if (
                data[i].type === "environment" &&
                env === null
            ) {

                env = data[i];

            }

        }



        // =========================
        // PM2.5
        // =========================

        if (pm) {

            const pmValue =
                Number(pm.pm25);


            document.getElementById("pm25").innerText =
                pmValue + " µg/m³";


            // PM STATUS

            if (pmValue >= 37.5) {

                document.getElementById("pmStatus").innerText =
                    "สูง";


                document.getElementById("airStatus").innerText =
                    "🟢 เปิดอัตโนมัติ";


                document.getElementById("autoStatus").innerText =
                    "🟢 เปิดอัตโนมัติ";


                document.getElementById("alert").innerText =
                    "⚠️ PM2.5 สูง เครื่องฟอกอากาศทำงานอัตโนมัติ";

            }


            else if (pmValue <= 35) {

                document.getElementById("pmStatus").innerText =
                    "ปกติ";


                document.getElementById("airStatus").innerText =
                    "⚪ ปิดอัตโนมัติ";


                document.getElementById("autoStatus").innerText =
                    "⚪ ปิดอัตโนมัติ";


                document.getElementById("alert").innerText =
                    "ปกติ";

            }


            else {

                document.getElementById("pmStatus").innerText =
                    "กำลังตรวจสอบ";


                document.getElementById("airStatus").innerText =
                    "🟡 รอการตรวจสอบ";


                document.getElementById("autoStatus").innerText =
                    "🟡 รอการตรวจสอบ";


                document.getElementById("alert").innerText =
                    "PM2.5 อยู่ในช่วงรอตัดสินใจ";

            }

        }



        // =========================
        // Temperature / Humidity /
        // Motion
        // =========================

        if (env) {


            // Temperature

            if (env.temperature !== undefined) {

                document.getElementById("temperature").innerText =
                    env.temperature + " °C";

            }



            // Humidity

            if (env.humidity !== undefined) {

                document.getElementById("humidity").innerText =
                    env.humidity + " %";

            }



            // Motion

            if (env.motion !== undefined) {

                if (env.motion == 1) {

                    document.getElementById("motion").innerText =
                        "มีการเคลื่อนไหว";


                    document.getElementById("laserStatus").innerText =
                        "มีการเคลื่อนไหว";

                }

                else {

                    document.getElementById("motion").innerText =
                        "ไม่มีการเคลื่อนไหว";


                    document.getElementById("laserStatus").innerText =
                        "ไม่มีการเคลื่อนไหว";

                }

            }



            // DHT11

            if (
                env.temperature !== undefined &&
                env.humidity !== undefined
            ) {

                document.getElementById("dhtStatus").innerText =
                    "ทำงานปกติ";

            }

        }



        // =========================
        // PM2.5 Chart
        // =========================

        updateChart(data);


    }

    catch (error) {

        console.log("Error:", error);

    }

}



// =========================
// PM2.5 CHART
// =========================

function updateChart(data) {


    const pmData = data

        .filter(
            item => item.type === "pm25"
        )

        .slice(0, 20)

        .reverse();



    const labels = pmData.map(item => {


        if (item.time) {

            return new Date(
                item.time
            ).toLocaleTimeString(

                "th-TH",

                {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                }

            );

        }


        return "--:--:--";

    });



    const values = pmData.map(item =>

        Number(item.pm25)

    );



    const canvas =
        document.getElementById("pmChart");


    if (!canvas) {

        console.log("ไม่พบ pmChart");

        return;

    }



    if (pmChart === null) {


        pmChart = new Chart(

            canvas,

            {

                type: "line",


                data: {

                    labels: labels,


                    datasets: [

                        {

                            label: "PM2.5",

                            data: values,

                            borderWidth: 3,

                            tension: 0.3,

                            fill: false

                        }

                    ]

                },


                options: {

                    responsive: true,

                    maintainAspectRatio: false,


                    scales: {

                        y: {

                            beginAtZero: true,


                            title: {

                                display: true,

                                text:
                                    "PM2.5 (µg/m³)"

                            }

                        },


                        x: {

                            title: {

                                display: true,

                                text: "เวลา"

                            }

                        }

                    }

                }

            }

        );

    }


    else {


        pmChart.data.labels =
            labels;


        pmChart.data.datasets[0].data =
            values;


        pmChart.update();

    }

}



// =========================
// CONTROL DEVICE
// =========================

async function controlDevice(
    device,
    state
) {


    try {


        const response = await fetch(

            API +
            "/api/control/" +
            device +
            "/" +
            state,

            {

                method: "POST"

            }

        );


        const result =
            await response.json();


        if (result.success) {


            // Update status on screen

            if (device === "light") {

                document.getElementById(
                    "lightState"
                ).innerText =
                    state === "ON"
                        ? "เปิด"
                        : "ปิด";

            }


            if (device === "ac") {

                document.getElementById(
                    "acState"
                ).innerText =
                    state === "ON"
                        ? "เปิด"
                        : "ปิด";

            }


            if (device === "fan") {

                document.getElementById(
                    "fanState"
                ).innerText =
                    state === "ON"
                        ? "เปิด"
                        : "ปิด";

            }


            alert(
                device + " : " + state
            );

        }


    }

    catch (error) {

        console.log(
            "Control Error:",
            error
        );

    }

}



// =========================
// START
// =========================

loadData();

setInterval(
    loadData,
    3000
);