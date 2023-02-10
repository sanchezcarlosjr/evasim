using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class CameraController : MonoBehaviour
{
	private float moveSpeed = 0.5f;
	private float scrollSpeed = 10f;
	void Update()
	{
		if (Input.GetAxisRaw("Horizontal") != 0 || Input.GetAxisRaw("Vertical") != 0) {
			transform.position += moveSpeed * new Vector3(Input.GetAxisRaw("Horizontal"), 0, Input.GetAxisRaw("Vertical"));
		}
		if (Input.GetAxis("Mouse ScrollWheel") != 0) {
			transform.position += scrollSpeed * new Vector3(0, Input.GetAxis("Mouse ScrollWheel"), 0);
		}
		if (Input.GetAxisRaw("Mouse X") != 0 || Input.GetAxisRaw("Mouse Y") != 0) {
			transform.eulerAngles = transform.eulerAngles - new Vector3(Input.GetAxis("Mouse Y"), Input.GetAxis("Mouse X") * -1, 0);
		}
	}
}
