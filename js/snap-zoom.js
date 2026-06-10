(function(){
var box=document.getElementById('snapZoom');
var img=document.getElementById('snapZoomImg');
var _h;
var _activeThumb=null;

function show(th){
  var s=th.dataset.snap;if(!s)return;
  img.src=s;
  var r=th.getBoundingClientRect(),bw=280,bh=280;
  var left=r.right+10;
  if(left+bw>window.innerWidth-8)left=r.left-bw-10;
  var top=r.top+r.height/2-bh/2;
  top=Math.max(8,Math.min(top,window.innerHeight-bh-8));
  box.style.left=left+'px';box.style.top=top+'px';
  box.style.opacity='0';box.style.transform='scale(0.88)';
  box.style.display='block';
  requestAnimationFrame(function(){box.style.opacity='1';box.style.transform='scale(1)';});
}
function hide(){
  clearTimeout(_h);
  _h=setTimeout(function(){
    box.style.opacity='0';box.style.transform='scale(0.88)';
    setTimeout(function(){box.style.display='none';},180);
  },50);
  _activeThumb=null;
}

// Desktop: hover
document.addEventListener('mouseover',function(e){var t=e.target.closest('.cart-item-thumb');if(t&&t.dataset.snap){clearTimeout(_h);show(t);}});
document.addEventListener('mouseout',function(e){var t=e.target.closest('.cart-item-thumb');if(t){hide();}});

// Mobile: tap to toggle (tap same thumb = close, tap other = switch, tap outside = close)
document.addEventListener('touchstart',function(e){
  var t=e.target.closest('.cart-item-thumb');
  if(t&&t.dataset.snap){
    e.preventDefault();
    e.stopPropagation();
    if(_activeThumb===t){
      // tap same thumb again — close
      hide();
      return;
    }
    _activeThumb=t;
    clearTimeout(_h);
    var s=t.dataset.snap;
    img.src=s;
    var r=t.getBoundingClientRect(),bw=260,bh=260;
    var left=r.left+r.width/2-bw/2;
    left=Math.max(8,Math.min(left,window.innerWidth-bw-8));
    var top=r.top-bh-12;
    if(top<8)top=r.bottom+12;
    top=Math.max(8,Math.min(top,window.innerHeight-bh-8));
    box.style.left=left+'px';box.style.top=top+'px';
    box.style.opacity='0';box.style.transform='scale(0.88)';
    box.style.display='block';
    requestAnimationFrame(function(){box.style.opacity='1';box.style.transform='scale(1)';});
  } else if(_activeThumb){
    // tap outside any thumb — close
    hide();
  }
},{passive:false,capture:true});

// Block context menu on thumbnails (long-press menu)
document.addEventListener('contextmenu',function(e){
  if(e.target.closest('.cart-item-thumb')){e.preventDefault();}
});

// Block long-press save dialog on the zoom image itself
box.addEventListener('contextmenu',function(e){e.preventDefault();});
img.addEventListener('contextmenu',function(e){e.preventDefault();});
box.addEventListener('touchstart',function(e){e.preventDefault();},{passive:false});

})();
