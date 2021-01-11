const firebaseConfig = {
  apiKey: "AIzaSyDFC-SKu9kx2_P_u7v-rOZjH94rFsZjdTk",
  authDomain: "drop-tag.firebaseapp.com",
  projectId: "drop-tag",
  storageBucket: "drop-tag.appspot.com",
  messagingSenderId: "515984000323",
  appId: "1:515984000323:web:da6ba973dffcb6f34f9bf6",
  measurementId: "G-FZV78H26DN"
};

firebase.initializeApp(firebaseConfig);

//

(function() {
  emailjs.init("user_wOCA2oFC0Cnfeg861JSvr");
})();

sendmail = () => {
  let templateParams = { userMail: "jerr35868@gmail.com" };
  let service_id = "service_gc2qd2d";
  let template_id = "template_yaqmspl";
  let userID = "user_wOCA2oFC0Cnfeg861JSvr";

  emailjs
    .send(service_id, template_id, templateParams, userID)
    .then(response => {
      console.log("SUCCESS!", response.status, response.text);
    })
    .catch(error => {
      console.log("FAILED...", error);
    });
};

window.addEventListener("DOMContentLoaded", main, false);

function main() {
  const mapConfig = {
    zoom: 16,
    center: { lat: 24.79438, lng: 120.99331 },
    scaleControl: true,
    scrollwheel: false,
    streetViewControl: true
  };

  const dynamicMapDom = document.getElementById("dynamicMap");
  const staticMapDom = document.getElementById("staticMap");

  const gMap = google.maps;
  const dynamicMap = new gMap.Map(dynamicMapDom, mapConfig);
  const staticMap = new gMap.Map(staticMapDom, mapConfig);

  const firestore = firebase.firestore();
  const gpsCollection = firestore.collection("GPS");

  const router = new gMap.DirectionsService();

  if (Notification && Notification.permission !== "granted") {
    Notification.requestPermission(status => {
      if (Notification.permission !== status) Notification.permission = status;
    });
  }

  let isTriggered = false;
  let isLoss = false;
  let isTaken = false;
  let isSended = false;

  gpsCollection.onSnapshot(querySnapshot => {
    if (isTriggered) {
      gpsCollection
        .orderBy("time", "desc")
        .limit(1)
        .get()
        .then(querySnapshot => {
          querySnapshot.forEach(doc => {
            const itemDat = doc.data();
            const itemGps = { lat: itemDat.latitude, lng: itemDat.longitude };

            if (!isLoss) {
              itemGps.lat = Math.random() * (24.79591 - 24.78699) + 24.78699;
              itemGps.lng = Math.random() * (120.99535 - 120.9897) + 120.9897;

              itemDat.latitude = itemGps.lat;
              itemDat.longitude = itemGps.lng;
            } else {
              if (isTaken) {
                firestore
                  .collection("movGPS")
                  .orderBy("time", "desc")
                  .limit(1)
                  .get()
                  .then(querySnapshot => {
                    if (!isSended) {
                      const notification = new Notification("Item is taken !");
                      sendmail();
                      isSended = true;
                    }

                    querySnapshot.forEach(doc => {
                      const lossItemDat = doc.data();
                      const lossItemGps = {
                        lat: Math.random() * 0.005 + lossItemDat.latitude,
                        lng: Math.random() * 0.005 + lossItemDat.longitude
                      };

                      const renderer = new gMap.DirectionsRenderer({ map: dynamicMap });
                      renderer.setOptions({
                        preserveViewport: true,
                        suppressMarkers: true,
                        polylineOptions: { strokeColor: "Red" }
                      });

                      const routing = new Promise((resolve, reject) => {
                        router.route(
                          {
                            origin: { lat: lossItemDat.latitude, lng: lossItemDat.longitude },
                            destination: lossItemGps,
                            travelMode: "WALKING"
                          },
                          (result, status) => {
                            if (status == gMap.DirectionsStatus.OK) {
                              const movMarker = new gMap.Marker({
                                map: dynamicMap,
                                title: "mov",
                                position: lossItemGps,
                                icon: "https://maps.google.com/mapfiles/ms/micons/red.png"
                              });

                              renderer.setDirections(result);

                              resolve(result);
                            } else {
                              reject(status);
                            }
                          }
                        );
                      });

                      routing.then(result => {
                        lossItemDat.latitude = lossItemGps.lat;
                        lossItemDat.longitude = lossItemGps.lng;

                        firestore
                          .collection("movGPS")
                          .doc(itemDat.time.toString())
                          .set(lossItemDat);
                      });
                    });
                  });
              }
            }

            //navigator.geolocation.getCurrentPosition(phonePos => {
            //const phoneCoords = phonePos.coords;
            //const phoneLatitude = phoneCoords.latitude;
            const phoneLatitude = 24.791917650864807;
            //const phoneLongitude = phoneCoords.longitude;
            const phoneLongitude = 120.99385837813622;
            const phoneDat = JSON.parse(JSON.stringify(itemDat));
            const phoneGps = { lat: phoneLatitude, lng: phoneLongitude };

            phoneDat.latitude = 24.791917650864807;
            phoneDat.longitude = 120.99385837813622;

            if (!isLoss) {
              const routing = new Promise((resolve, reject) => {
                router.route({ origin: itemGps, destination: phoneGps, travelMode: "WALKING" }, (result, status) => {
                  if (status == gMap.DirectionsStatus.OK) {
                    let distance = 0;

                    result.routes[0].legs[0].steps.forEach(segment => {
                      distance += segment.distance.value;
                    });

                    resolve(distance);
                  } else {
                    reject(status);
                  }
                });
              });

              routing
                .then(dist => {
                  if (!isLoss) {
                    if (dist > 200) {
                      isLoss = true;

                      const notification = new Notification("Item is loss !");

                      const lossDate = new Date(new Date(phoneDat.time).getTime() - 28800000);
                      const itemMarker = new gMap.Marker({
                        map: dynamicMap,
                        title: "item",
                        position: itemGps,
                        icon: "https://maps.google.com/mapfiles/ms/micons/orange.png"
                      });
                      const phoneMarker = new gMap.Marker({
                        map: dynamicMap,
                        title: "phone",
                        position: phoneGps,
                        icon: "https://maps.google.com/mapfiles/ms/micons/blue.png"
                      });

                      firestore
                        .collection("Vibration")
                        .orderBy("time", "desc")
                        .limit(30)
                        .get()
                        .then(querySnapshot => {
                          querySnapshot.forEach(doc => {
                            const vibrationDat = doc.data();
                            const VibrationDate = new Date(new Date(vibrationDat.time.time).getTime() - 28800000);

                            if (lossDate.getMinutes() - VibrationDate.getMinutes() > 3) {
                              // put
                            } else {
                              if (!isTaken) {
                                gpsCollection
                                  .orderBy("time", "desc")
                                  .limit(10)
                                  .get()
                                  .then(querySnapshot => {
                                    querySnapshot.forEach(doc => {
                                      const movDat = doc.data();

                                      if (phoneDat.latitude != itemDat.latitude || phoneDat.longitude != itemDat.longitude) {
                                        isTaken = true;

                                        firestore
                                          .collection("movGPS")
                                          .doc(itemDat.time.toString())
                                          .set(itemDat);
                                      }
                                    });
                                  });
                              }
                            }
                          });
                        });

                      firestore
                        .collection("phoneGPS")
                        .doc(phoneDat.time.toString())
                        .set(phoneDat);

                      firestore
                        .collection("lossGPS")
                        .doc(itemDat.time.toString())
                        .set(itemDat);
                    }
                  }
                })
                .catch(error => console.log(error));
            }
          });
          //}); //nav
        })
        .catch(error => {
          console.log(error);
        });
    }

    isTriggered = true;
  });
}

!(function($) {
  "use strict";

  // Hero typed
  if ($(".typed").length) {
    var typed_strings = $(".typed").data("typed-items");
    typed_strings = typed_strings.split(",");
    new Typed(".typed", {
      strings: typed_strings,
      loop: true,
      typeSpeed: 100,
      backSpeed: 50,
      backDelay: 2000
    });
  }

  // Smooth scroll for the navigation menu and links with .scrollto classes
  $(document).on("click", ".nav-menu a, .scrollto", function(e) {
    if (location.pathname.replace(/^\//, "") == this.pathname.replace(/^\//, "") && location.hostname == this.hostname) {
      e.preventDefault();
      var target = $(this.hash);
      if (target.length) {
        var scrollto = target.offset().top;

        $("html, body").animate(
          {
            scrollTop: scrollto
          },
          1500,
          "easeInOutExpo"
        );

        if ($(this).parents(".nav-menu, .mobile-nav").length) {
          $(".nav-menu .active, .mobile-nav .active").removeClass("active");
          $(this)
            .closest("li")
            .addClass("active");
        }

        if ($("body").hasClass("mobile-nav-active")) {
          $("body").removeClass("mobile-nav-active");
          $(".mobile-nav-toggle i").toggleClass("icofont-navigation-menu icofont-close");
        }
        return false;
      }
    }
  });

  // Activate smooth scroll on page load with hash links in the url
  $(document).ready(function() {
    if (window.location.hash) {
      var initial_nav = window.location.hash;
      if ($(initial_nav).length) {
        var scrollto = $(initial_nav).offset().top;
        $("html, body").animate(
          {
            scrollTop: scrollto
          },
          1500,
          "easeInOutExpo"
        );
      }
    }
  });

  $(document).on("click", ".mobile-nav-toggle", function(e) {
    $("body").toggleClass("mobile-nav-active");
    $(".mobile-nav-toggle i").toggleClass("icofont-navigation-menu icofont-close");
  });

  $(document).click(function(e) {
    var container = $(".mobile-nav-toggle");
    if (!container.is(e.target) && container.has(e.target).length === 0) {
      if ($("body").hasClass("mobile-nav-active")) {
        $("body").removeClass("mobile-nav-active");
        $(".mobile-nav-toggle i").toggleClass("icofont-navigation-menu icofont-close");
      }
    }
  });

  // Navigation active state on scroll
  var nav_sections = $("section");
  var main_nav = $(".nav-menu, .mobile-nav");

  $(window).on("scroll", function() {
    var cur_pos = $(this).scrollTop() + 200;

    nav_sections.each(function() {
      var top = $(this).offset().top,
        bottom = top + $(this).outerHeight();

      if (cur_pos >= top && cur_pos <= bottom) {
        if (cur_pos <= bottom) {
          main_nav.find("li").removeClass("active");
        }
        main_nav
          .find('a[href="#' + $(this).attr("id") + '"]')
          .parent("li")
          .addClass("active");
      }
      if (cur_pos < 300) {
        $(".nav-menu ul:first li:first").addClass("active");
      }
    });
  });

  // Back to top button
  $(window).scroll(function() {
    if ($(this).scrollTop() > 100) {
      $(".back-to-top").fadeIn("slow");
    } else {
      $(".back-to-top").fadeOut("slow");
    }
  });

  $(".back-to-top").click(function() {
    $("html, body").animate(
      {
        scrollTop: 0
      },
      1500,
      "easeInOutExpo"
    );
    return false;
  });

  // jQuery counterUp
  $('[data-toggle="counter-up"]').counterUp({
    delay: 10,
    time: 1000
  });

  // Skills section
  $(".skills-content").waypoint(
    function() {
      $(".progress .progress-bar").each(function() {
        $(this).css("width", $(this).attr("aria-valuenow") + "%");
      });
    },
    {
      offset: "80%"
    }
  );

  // Porfolio isotope and filter
  $(window).on("load", function() {
    var portfolioIsotope = $(".portfolio-container").isotope({
      itemSelector: ".portfolio-item",
      layoutMode: "fitRows"
    });

    $("#portfolio-flters li").on("click", function() {
      $("#portfolio-flters li").removeClass("filter-active");
      $(this).addClass("filter-active");

      portfolioIsotope.isotope({
        filter: $(this).data("filter")
      });
      aos_init();
    });

    // Initiate venobox (lightbox feature used in portofilo)
    $(document).ready(function() {
      $(".venobox").venobox();
    });
  });

  // Testimonials carousel (uses the Owl Carousel library)
  $(".testimonials-carousel").owlCarousel({
    autoplay: true,
    dots: true,
    loop: true,
    responsive: {
      0: {
        items: 1
      },
      768: {
        items: 2
      },
      900: {
        items: 3
      }
    }
  });

  // Portfolio details carousel
  $(".portfolio-details-carousel").owlCarousel({
    autoplay: true,
    dots: true,
    loop: true,
    items: 1
  });

  // Init AOS
  function aos_init() {
    AOS.init({
      duration: 1000,
      easing: "ease-in-out-back",
      once: true
    });
  }
  $(window).on("load", function() {
    aos_init();
  });
})(jQuery);
