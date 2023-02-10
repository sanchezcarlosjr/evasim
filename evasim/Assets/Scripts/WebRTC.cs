using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Runtime.InteropServices;

public class WebRTC : MonoBehaviour
{
	[DllImport("__Internal")]
	private static extern void Init();

	void Start() {
		Init();
	}
}
